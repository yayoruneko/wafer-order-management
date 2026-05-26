package com.semiconductor.woms.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.UserType;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "admin", authorities = "ADMIN")
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setupAdminUser() {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setId("admin-" + UUID.randomUUID());
            admin.setUsername("admin");
            admin.setPasswordHash("$2a$10$notUsedInTests");
            admin.setRole(UserType.ADMIN);
            admin.setCreatedAt(LocalDateTime.now());
            userRepository.save(admin);
        }
    }

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

    // --- Case 4: customerId 不存在，createOrder 應該回傳 404 並顯示「找不到此客戶」 ---
    @Test
    void createOrder_unknownCustomer_returns404WithMessage() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson("NONEXISTENT-" + UUID.randomUUID(), 100, LocalDate.now().plusDays(7))))
                .andExpect(status().isNotFound())
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

    // ── New test cases ────────────────────────────────────────────────────────

    @Test
    void getOrderById_returns200WithOrderBody() throws Exception {
        Customer customer = new Customer();
        customer.setCustomerCode("GET-BY-ID-" + UUID.randomUUID());
        customer.setName("GetById Customer");
        customer.setIsActive(true);
        Customer saved = customerRepository.save(customer);

        MvcResult createRes = mockMvc.perform(
                        post("/api/orders")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(buildOrderJson(saved.getId(), 100, LocalDate.now().plusDays(5))))
                .andExpect(status().isCreated())
                .andReturn();

        String orderId = ((ObjectNode) objectMapper.readTree(createRes.getResponse().getContentAsString()))
                .get("id").asText();

        mockMvc.perform(get("/api/orders/{id}", orderId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(orderId))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.quantity").value(100));
    }

    @Test
    void cancelOrder_returns200() throws Exception {
        Customer customer = new Customer();
        customer.setCustomerCode("CANCEL-" + UUID.randomUUID());
        customer.setName("Cancel Customer");
        customer.setIsActive(true);
        Customer saved = customerRepository.save(customer);

        MvcResult createRes = mockMvc.perform(
                        post("/api/orders")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(buildOrderJson(saved.getId(), 200, LocalDate.now().plusDays(7))))
                .andExpect(status().isCreated())
                .andReturn();

        String orderId = ((ObjectNode) objectMapper.readTree(createRes.getResponse().getContentAsString()))
                .get("id").asText();

        mockMvc.perform(delete("/api/orders/{id}", orderId))
                .andExpect(status().isOk());
    }

    @Test
    void createOrder_quantityAtMinBoundary_returns201() throws Exception {
        Customer customer = new Customer();
        customer.setCustomerCode("MIN-QTY-" + UUID.randomUUID());
        customer.setName("Min Qty Customer");
        customer.setIsActive(true);
        Customer saved = customerRepository.save(customer);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson(saved.getId(), 25, LocalDate.now().plusDays(7))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(25))
                .andExpect(jsonPath("$.remainingQuantity").value(25));
    }

    @Test
    void createOrder_quantityAtMaxBoundary_returns201() throws Exception {
        Customer customer = new Customer();
        customer.setCustomerCode("MAX-QTY-" + UUID.randomUUID());
        customer.setName("Max Qty Customer");
        customer.setIsActive(true);
        Customer saved = customerRepository.save(customer);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson(saved.getId(), 2500, LocalDate.now().plusDays(7))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(2500));
    }

    // ── 新增的整合測試 ────────────────────────────────────────────────────────
    // 對應 SCHEDULING_RULES.md 中 HTTP 邊緣案例：
    //  - PUT /api/orders/{id} 完整流程（service 層已測，但 controller wiring 沒測過）
    //  - 樂觀鎖：帶舊 updatedAt → 必須回 409（規則四之 2）
    //  - 交期等於今日 → 必須回 400 + 「交期」訊息
    //  - 不存在的訂單 → 404
    //  - view=delayed / view=in_production 過濾參數會傳到 service

    @Test
    void updateOrder_validRequest_returns200() throws Exception {
        Customer customer = new Customer();
        customer.setCustomerCode("UPDATE-OK-" + UUID.randomUUID());
        customer.setName("Update Customer");
        customer.setIsActive(true);
        Customer saved = customerRepository.save(customer);

        MvcResult createRes = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson(saved.getId(), 100, LocalDate.now().plusDays(7))))
                .andExpect(status().isCreated())
                .andReturn();
        String orderId = ((ObjectNode) objectMapper.readTree(createRes.getResponse().getContentAsString()))
                .get("id").asText();

        ObjectNode body = objectMapper.createObjectNode();
        body.put("quantity", 250);
        body.put("customerDueDate", LocalDate.now().plusDays(14).toString());

        mockMvc.perform(put("/api/orders/{id}", orderId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(containsString(orderId)));
    }

    @Test
    void updateOrder_staleUpdatedAt_returns409() throws Exception {
        // 規則四之 2：兩使用者同時開同一筆訂單，後者帶舊 updatedAt → 必須拒絕
        Customer customer = new Customer();
        customer.setCustomerCode("OPT-LOCK-" + UUID.randomUUID());
        customer.setName("Lock Customer");
        customer.setIsActive(true);
        Customer saved = customerRepository.save(customer);

        MvcResult createRes = mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson(saved.getId(), 100, LocalDate.now().plusDays(7))))
                .andExpect(status().isCreated())
                .andReturn();
        String orderId = ((ObjectNode) objectMapper.readTree(createRes.getResponse().getContentAsString()))
                .get("id").asText();

        ObjectNode body = objectMapper.createObjectNode();
        body.put("quantity", 200);
        body.put("customerDueDate", LocalDate.now().plusDays(10).toString());
        // 故意送一個與真實值絕對不同的舊時間戳
        body.put("updatedAt", "2020-01-01T00:00:00");

        mockMvc.perform(put("/api/orders/{id}", orderId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict());
    }

    @Test
    void createOrder_dueDateToday_returns400() throws Exception {
        // 邊界：交期必須「晚於」今日，今天本身不通過
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildOrderJson("CUST-DUMMY", 100, LocalDate.now())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("交期")));
    }

    @Test
    void getOrderById_unknownId_returns500WithMessage() throws Exception {
        // OrderService 對未知 id 拋 RuntimeException → GlobalExceptionHandler 回 500
        // 這個測試「鎖住」目前的對外契約；若改為更語義化的 404 ResponseStatusException
        // 也是合理重構，屆時更新此測試以反映新行為。
        mockMvc.perform(get("/api/orders/{id}", "NON-EXIST-" + UUID.randomUUID()))
                .andExpect(status().is5xxServerError())
                .andExpect(jsonPath("$.message").value(containsString("找不到訂單")));
    }

    @Test
    void getOrderSlots_unknownOrder_returns5xx() throws Exception {
        mockMvc.perform(get("/api/orders/{id}/slots", "MISSING-" + UUID.randomUUID()))
                .andExpect(status().is5xxServerError());
    }

    @Test
    void getOrderHistory_unknownOrder_returns404() throws Exception {
        // getOrderHistory 用 ResponseStatusException(NOT_FOUND)
        mockMvc.perform(get("/api/orders/{id}/history", "MISSING-" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void getOrders_viewDelayed_returnsOnlyDelayed() throws Exception {
        // 此測試只驗證 endpoint 對 view 參數有反應、回傳是合法的 JSON 陣列。
        // 此處不假設資料庫初始狀態（其他測試可能也有訂單），重點是 200 + Array。
        mockMvc.perform(get("/api/orders").param("view", "delayed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getOrders_viewInProduction_returnsArray() throws Exception {
        mockMvc.perform(get("/api/orders").param("view", "in_production"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
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
