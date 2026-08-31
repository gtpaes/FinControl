package com.fincontrol.service;

import com.fincontrol.dto.CreateIncomeRequest;
import com.fincontrol.dto.IncomeResponse;
import com.fincontrol.dto.UpdateIncomeRequest;
import com.fincontrol.entity.Income;
import com.fincontrol.entity.IncomeCategory;
import com.fincontrol.exception.ResourceNotFoundException;
import com.fincontrol.mapper.IncomeMapper;
import com.fincontrol.repository.IncomeRepository;
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
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final MongoTemplate mongoTemplate;

    public IncomeService(IncomeRepository incomeRepository, MongoTemplate mongoTemplate) {
        this.incomeRepository = incomeRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public IncomeResponse create(UUID userId, CreateIncomeRequest request) {
        Income income = new Income();
        income.setUserId(userId);
        income.setDescription(request.description().trim());
        income.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        income.setDate(request.date());
        income.setCategory(request.category());
        income.setRecurrence(request.recurrence() == null
                ? com.fincontrol.entity.Recurrence.UNICA : request.recurrence());
        income.setNotes(request.notes());
        return IncomeMapper.toResponse(incomeRepository.save(income));
    }

    public Page<IncomeResponse> list(UUID userId, IncomeCategory category, LocalDate dateFrom, LocalDate dateTo, int page, int size) {
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

        List<Income> items = mongoTemplate.find(dataQuery, Income.class);

        Query countQuery = new Query();
        countQuery.addCriteria(Criteria.where("user_id").is(userId));
        addDateRange(countQuery, dateFrom, dateTo);
        if (category != null) {
            countQuery.addCriteria(Criteria.where("category").is(category));
        }
                long total = mongoTemplate.count(countQuery, Income.class);

        List<IncomeResponse> responses = items.stream()
                .map(IncomeMapper::toResponse)
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

    public IncomeResponse findById(UUID userId, UUID id) {
        return IncomeMapper.toResponse(getOwned(userId, id));
    }

    public IncomeResponse update(UUID userId, UUID id, UpdateIncomeRequest request) {
        Income income = getOwned(userId, id);
        income.setDescription(request.description().trim());
        income.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        income.setDate(request.date());
        income.setCategory(request.category());
        income.setRecurrence(request.recurrence() == null
                ? com.fincontrol.entity.Recurrence.UNICA : request.recurrence());
        income.setNotes(request.notes());
        return IncomeMapper.toResponse(incomeRepository.save(income));
    }

    public void delete(UUID userId, UUID id) {
        Income income = getOwned(userId, id);
        incomeRepository.delete(income);
    }

    private Income getOwned(UUID userId, UUID id) {
        return incomeRepository.findByAppIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Receita", id));
    }
}
