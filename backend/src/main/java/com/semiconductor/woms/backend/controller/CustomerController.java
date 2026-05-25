package com.semiconductor.woms.backend.controller;

import com.semiconductor.woms.backend.dto.CustomerRequest;
import com.semiconductor.woms.backend.dto.CustomerResponse;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Tag(name = "customer")
public class CustomerController {

    private final CustomerRepository customerRepository;

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> getCustomers() {
        List<CustomerResponse> result = customerRepository.findByIsActiveTrue().stream()
                .map(c -> new CustomerResponse(c.getId(), c.getCustomerCode(), c.getName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
        String name = request.getName().trim();

        String code = (request.getCustomerCode() != null && !request.getCustomerCode().isBlank())
                ? request.getCustomerCode().trim()
                : generateNextCode();

        if (customerRepository.findByCustomerCode(code).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "客戶代碼已存在：" + code);
        }

        Customer customer = new Customer();
        customer.setId(UUID.randomUUID().toString());
        customer.setName(name);
        customer.setCustomerCode(code);
        customer.setIsActive(true);

        Customer saved = customerRepository.save(customer);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CustomerResponse(saved.getId(), saved.getCustomerCode(), saved.getName()));
    }

    private String generateNextCode() {
        List<Customer> all = customerRepository.findAll();
        int max = all.stream()
                .map(c -> c.getCustomerCode().replaceAll("\\D+", ""))
                .filter(s -> !s.isEmpty())
                .mapToInt(s -> { try { return Integer.parseInt(s); } catch (NumberFormatException e) { return 0; } })
                .max()
                .orElse(0);
        return String.format("CUST-%03d", max + 1);
    }
}
