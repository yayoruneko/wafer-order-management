package com.semiconductor.woms.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Test
    void createThenList_ordersRoundTrip() throws Exception {
        Customer customer = new Customer();
        customer.setCustomerCode("CUST-INT");
        customer.setName("Integration Customer");
        customer.setIsActive(true);
        Customer savedCustomer = customerRepository.save(customer);

        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-INT");
        req.setWaferTypeId("WT-INT");
        req.setCustomerId(savedCustomer.getId());
        req.setQuantity(250);
        req.setCustomerDueDate(LocalDate.now().plusDays(14));

        MvcResult createRes = mockMvc.perform(
                        post("/api/orders")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req))
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.quantity").value(250))
            .andReturn();

        ObjectNode created = (ObjectNode) objectMapper.readTree(createRes.getResponse().getContentAsString());
        String createdId = created.get("id").asText();

        MvcResult listRes = mockMvc.perform(get("/api/orders"))
            .andExpect(status().isOk())
            .andReturn();

        ArrayNode list = (ArrayNode) objectMapper.readTree(listRes.getResponse().getContentAsString());
        boolean containsCreated = false;
        for (int i = 0; i < list.size(); i++) {
            if (createdId.equals(list.get(i).get("id").asText())) {
            containsCreated = true;
            break;
            }
        }
        assertTrue(containsCreated, "Expected list to contain created order id: " + createdId);
    }

    // --- Case 1: 數量低於 25，createOrder 應該回傳 400 ---
    @Test
    void createOrder_quantityBelowMin_returns400() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson("CUST-DUMMY", 24, LocalDate.now().plusDays(7))))
                .andExpect(status().isBadRequest());
    }

    // --- Case 2: 數量高於 2500，createOrder 應該回傳 400 ---
    @Test
    void createOrder_quantityAboveMax_returns400() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson("CUST-DUMMY", 2501, LocalDate.now().plusDays(7))))
                .andExpect(status().isBadRequest());
    }

    // --- Case 3: 交期是昨天，createOrder 應該回傳 400 並顯示「交期已過」 ---
    @Test
    void createOrder_pastDueDate_returns400WithMessage() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson("CUST-DUMMY", 100, LocalDate.now().minusDays(1))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("交期")));
    }

    // --- Case 4: customerId 不存在，createOrder 應該回傳 400 並顯示「找不到此客戶」 ---
    @Test
    void createOrder_unknownCustomer_returns400WithMessage() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson("NONEXISTENT-" + UUID.randomUUID(), 100, LocalDate.now().plusDays(7))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("找不到此客戶")));
    }

    // --- Case 5: 正常新增訂單，回傳 201，status = PENDING，remainingQuantity = quantity ---
    @Test
    void createOrder_validRequest_returns201WithPendingAndMatchingQuantity() throws Exception {
        Customer customer = new Customer();
        customer.setCustomerCode("CTRL-INT-" + UUID.randomUUID());
        customer.setName("Controller Integration Customer");
        customer.setIsActive(true);
        Customer saved = customerRepository.save(customer);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson(saved.getId(), 300, LocalDate.now().plusDays(14))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.quantity").value(300))
                .andExpect(jsonPath("$.remainingQuantity").value(300));
    }

    private String buildOrderJson(String customerId, int quantity, LocalDate dueDate) throws Exception {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("customerId", customerId);
        node.put("factoryId", "FAB-CTRL");
        node.put("waferTypeId", "WT-CTRL");
        node.put("quantity", quantity);
        node.put("customerDueDate", dueDate.toString());
        return objectMapper.writeValueAsString(node);
    }
}
