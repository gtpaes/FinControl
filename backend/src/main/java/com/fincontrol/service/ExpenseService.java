package com.fincontrol.service;

import com.fincontrol.dto.CreateExpenseRequest;
import com.fincontrol.dto.ExpenseResponse;
import com.fincontrol.dto.UpdateExpenseRequest;
import com.fincontrol.entity.Expense;
import com.fincontrol.entity.ExpenseCategory;
import com.fincontrol.exception.ResourceNotFoundException;
import com.fincontrol.mapper.ExpenseMapper;
import com.fincontrol.repository.ExpenseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final MongoTemplate mongoTemplate;

    public ExpenseService(ExpenseRepository expenseRepository, MongoTemplate mongoTemplate) {
        this.expenseRepository = expenseRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public ExpenseResponse create(UUID userId, CreateExpenseRequest request) {
        Expense expense = new Expense();
        expense.setUserId(userId);
        expense.setDescription(request.description().trim());
        expense.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        expense.setDate(request.date());
        expense.setCategory(request.category());
        expense.setType(request.type() == null ? com.fincontrol.entity.ExpenseType.VARIAVEL : request.type());
        expense.setStatus(request.status() == null ? com.fincontrol.entity.ExpenseStatus.PAGA : request.status());
        expense.setRecurring(request.recurring() != null && request.recurring());
        expense.setNotes(request.notes());
        return ExpenseMapper.toResponse(expenseRepository.save(expense));
    }

    public Page<ExpenseResponse> list(UUID userId, ExpenseCategory category, LocalDate dateFrom, LocalDate dateTo, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

                Query dataQuery = new Query()
                .limit(safeSize)
                .skip((long) safePage * safeSize)
                .with(Sort.by(Sort.Direction.DESC, "date"));
        dataQuery.addCriteria(Criteria.where("user_id").is(userId));
        addDateRange(dataQuery, dateFrom, dateTo);
        if (category != null) {
            dataQuery.addCriteria(Criteria.where("category").is(category));
        }

        List<Expense> items = mongoTemplate.find(dataQuery, Expense.class);

        Query countQuery = new Query();
        countQuery.addCriteria(Criteria.where("user_id").is(userId));
        addDateRange(countQuery, dateFrom, dateTo);
        if (category != null) {
            countQuery.addCriteria(Criteria.where("category").is(category));
        }
        long total = mongoTemplate.count(countQuery, Expense.class);

        List<ExpenseResponse> responses = items.stream()
                .map(ExpenseMapper::toResponse)
                .toList();

                return new PageImpl<>(responses, PageRequest.of(safePage, safeSize), total);
    }

    /**
     * Aplica o filtro de intervalo de datas numa única {@link Criteria} para
     * evitar o erro do driver MongoDB:
     * "you can't add a second 'date' criteria".
     */
    private void addDateRange(Query query, LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return;
        }
        Criteria dateCriteria = Criteria.where("date");
        if (from != null) {
            dateCriteria = dateCriteria.gte(from);
        }
        if (to != null) {
            dateCriteria = dateCriteria.lte(to);
        }
        query.addCriteria(dateCriteria);
    }

    public ExpenseResponse findById(UUID userId, UUID id) {
        return ExpenseMapper.toResponse(getOwned(userId, id));
    }

    public ExpenseResponse update(UUID userId, UUID id, UpdateExpenseRequest request) {
        Expense expense = getOwned(userId, id);
        expense.setDescription(request.description().trim());
        expense.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        expense.setDate(request.date());
        expense.setCategory(request.category());
        expense.setType(request.type() == null ? com.fincontrol.entity.ExpenseType.VARIAVEL : request.type());
        expense.setStatus(request.status() == null ? com.fincontrol.entity.ExpenseStatus.PAGA : request.status());
        expense.setRecurring(request.recurring() != null && request.recurring());
        expense.setNotes(request.notes());
        return ExpenseMapper.toResponse(expenseRepository.save(expense));
    }

    public void delete(UUID userId, UUID id) {
        Expense expense = getOwned(userId, id);
        expenseRepository.delete(expense);
    }

    private Expense getOwned(UUID userId, UUID id) {
        return expenseRepository.findByAppIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Despesa", id));
    }
}
