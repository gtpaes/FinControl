package com.fincontrol.service;

import com.fincontrol.dto.AddAporteRequest;
import com.fincontrol.dto.CreateInvestmentRequest;
import com.fincontrol.dto.InvestmentEvolucaoPoint;
import com.fincontrol.dto.InvestmentResponse;
import com.fincontrol.dto.UpdateInvestmentRequest;
import com.fincontrol.entity.Aporte;
import com.fincontrol.entity.Investment;
import com.fincontrol.exception.ResourceNotFoundException;
import com.fincontrol.repository.InvestmentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class InvestmentService {

    private final InvestmentRepository investmentRepository;

    public InvestmentService(InvestmentRepository investmentRepository) {
        this.investmentRepository = investmentRepository;
    }

    public InvestmentResponse create(UUID userId, CreateInvestmentRequest request) {
        Investment inv = new Investment();
        inv.setUserId(userId);
        apply(inv, request.ticker(), request.name(), request.type(),
                request.quantity(), request.avgPrice(), request.currentPrice());
        return InvestmentResponse.from(investmentRepository.save(inv));
    }

    public List<InvestmentResponse> list(UUID userId) {
        return investmentRepository.findAllByUserId(userId).stream().map(InvestmentResponse::from).toList();
    }

    public InvestmentResponse findById(UUID userId, UUID id) {
        return InvestmentResponse.from(getOwned(userId, id));
    }

    public InvestmentResponse update(UUID userId, UUID id, UpdateInvestmentRequest request) {
        Investment inv = getOwned(userId, id);
        apply(inv, request.ticker(), request.name(), request.type(),
                request.quantity(), request.avgPrice(), request.currentPrice());
        return InvestmentResponse.from(investmentRepository.save(inv));
    }

    public void delete(UUID userId, UUID id) {
        investmentRepository.delete(getOwned(userId, id));
    }

    /** Registra um aporte: atualiza a lista embutida, a quantidade e o preço médio. */
    public InvestmentResponse addAporte(UUID userId, UUID id, AddAporteRequest request) {
        Investment inv = getOwned(userId, id);
        BigDecimal quantidadeAtual = inv.getQuantity();
        BigDecimal precoMedioAtual = inv.getAvgPrice();
        BigDecimal novaQuantidade = quantidadeAtual.add(request.quantity());
        // preço médio ponderado: (pm × q + valor do aporte) / nova quantidade
        BigDecimal custoTotal = precoMedioAtual.multiply(quantidadeAtual).add(request.amount());
        BigDecimal novoPrecoMedio = custoTotal.divide(novaQuantidade, 6, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);

        inv.getAportes().add(new Aporte(request.date(), request.amount(), request.quantity()));
        inv.setQuantity(novaQuantidade);
        inv.setAvgPrice(novoPrecoMedio);
        return InvestmentResponse.from(investmentRepository.save(inv));
    }

    /** Evolução dos investimentos: por mês, aportes do mês e custo acumulado. */
    public List<InvestmentEvolucaoPoint> evolucao(UUID userId, int meses) {
        List<Investment> investments = investmentRepository.findByUserId(userId);
        List<InvestmentEvolucaoPoint> pontos = new ArrayList<>();
        YearMonth fim = YearMonth.now();
        YearMonth inicio = fim.minusMonths(meses - 1L);
        BigDecimal acumulado = BigDecimal.ZERO;
        for (YearMonth m = inicio; !m.isAfter(fim); m = m.plusMonths(1)) {
            final YearMonth mes = m;
            BigDecimal aportesMes = investments.stream()
                    .flatMap(i -> i.getAportes().stream())
                    .filter(a -> a.getDate() != null && YearMonth.from(a.getDate()).equals(mes))
                    .map(a -> a.getAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            acumulado = acumulado.add(aportesMes);
            pontos.add(new InvestmentEvolucaoPoint(DashboardService.mesLabel(mes),
                    aportesMes.setScale(2, RoundingMode.HALF_UP),
                    acumulado.setScale(2, RoundingMode.HALF_UP)));
        }
        return pontos;
    }

    private Investment getOwned(UUID userId, UUID id) {
        return investmentRepository.findByAppIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Investimento", id));
    }

    private void apply(Investment inv, String ticker, String name, com.fincontrol.entity.InvestmentType type,
                       BigDecimal quantity, BigDecimal avgPrice, BigDecimal currentPrice) {
        inv.setTicker(ticker.trim().toUpperCase());
        inv.setName(name.trim());
        inv.setType(type);
        inv.setQuantity(quantity);
        inv.setAvgPrice(avgPrice.setScale(2, RoundingMode.HALF_UP));
        inv.setCurrentPrice(currentPrice.setScale(2, RoundingMode.HALF_UP));
    }
}
