package com.fincontrol.service;

import com.fincontrol.dto.CreateSalaryRequest;
import com.fincontrol.dto.SalaryResponse;
import com.fincontrol.dto.UpdateSalaryRequest;
import com.fincontrol.entity.Salary;
import com.fincontrol.exception.ResourceNotFoundException;
import com.fincontrol.mapper.SalaryMapper;
import com.fincontrol.repository.SalaryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class SalaryService {

    private final SalaryRepository salaryRepository;
    private final MongoTemplate mongoTemplate;

    public SalaryService(SalaryRepository salaryRepository, MongoTemplate mongoTemplate) {
        this.salaryRepository = salaryRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public SalaryResponse create(UUID userId, CreateSalaryRequest request) {
        Salary salary = new Salary();
        salary.setUserId(userId);
        salary.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        salary.setDescription(request.description());
        salary.setReferenceMonth(request.referenceMonth());
        return SalaryMapper.toResponse(salaryRepository.save(salary));
    }

    public Page<SalaryResponse> list(UUID userId, String referenceMonth, int page, int size) {
        if (referenceMonth != null && !referenceMonth.matches("^\\d{4}-(0[1-9]|1[0-2])$")) {
            throw new IllegalArgumentException("Mês inválido. Use o formato YYYY-MM.");
        }
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        Query dataQuery = new Query()
                .limit(safeSize)
                .skip((long) safePage * safeSize)
                .with(Sort.by(Sort.Direction.DESC, "reference_month"));
        dataQuery.addCriteria(Criteria.where("user_id").is(userId));
        if (referenceMonth != null) {
            dataQuery.addCriteria(Criteria.where("reference_month").is(referenceMonth));
        }

        List<Salary> items = mongoTemplate.find(dataQuery, Salary.class);

        Query countQuery = new Query();
        countQuery.addCriteria(Criteria.where("user_id").is(userId));
        if (referenceMonth != null) {
            countQuery.addCriteria(Criteria.where("reference_month").is(referenceMonth));
        }
        long total = mongoTemplate.count(countQuery, Salary.class);

        List<SalaryResponse> responses = items.stream()
                .map(SalaryMapper::toResponse)
                .toList();

        return new PageImpl<>(responses, PageRequest.of(safePage, safeSize), total);
    }

    public SalaryResponse findById(UUID userId, UUID id) {
        return SalaryMapper.toResponse(getOwned(userId, id));
    }

    public SalaryResponse update(UUID userId, UUID id, UpdateSalaryRequest request) {
        Salary salary = getOwned(userId, id);
        salary.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        salary.setDescription(request.description());
        salary.setReferenceMonth(request.referenceMonth());
        return SalaryMapper.toResponse(salaryRepository.save(salary));
    }

    public void delete(UUID userId, UUID id) {
        Salary salary = getOwned(userId, id);
        salaryRepository.delete(salary);
    }

    private Salary getOwned(UUID userId, UUID id) {
        return salaryRepository.findByAppIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Salario", id));
    }
}
