package com.semiconductor.woms.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.semiconductor.woms.backend.dto.OrderRequest;
import com.semiconductor.woms.backend.dto.OrderResponse;
import com.semiconductor.woms.backend.security.JwtAccessDeniedHandler;
import com.semiconductor.woms.backend.security.JwtAuthenticationEntryPoint;
import com.semiconductor.woms.backend.security.JwtUtils;
import com.semiconductor.woms.backend.security.UserDetailsServiceImpl;
import com.semiconductor.woms.backend.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
class OrderControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @MockBean
    private JwtAccessDeniedHandler jwtAccessDeniedHandler;

    @Test
    @WithMockUser(authorities = "ADMIN")
    void createOrder_returns201AndBody() throws Exception {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-001");
        req.setWaferTypeId("WT-001");
        req.setCustomerId("CUST-001");
        req.setQuantity(100);
        req.setCustomerDueDate(LocalDate.now().plusDays(10));

        OrderResponse resp = new OrderResponse();
        resp.setId("o-1");
        resp.setCustomerId("CUST-001");
        resp.setQuantity(100);
        resp.setRemainingQuantity(100);
        resp.setStatus("PENDING");
        resp.setCustomerDueDate(req.getCustomerDueDate());

        when(orderService.createOrder(any(OrderRequest.class))).thenReturn(resp);

        mockMvc.perform(
                        post("/api/orders")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req))
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("o-1"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.quantity").value(100));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllOrders_returnsList() throws Exception {
        OrderResponse a = new OrderResponse();
        a.setId("o-1");
        a.setStatus("PENDING");
        OrderResponse b = new OrderResponse();
        b.setId("o-2");
        b.setStatus("CANCELLED");

        when(orderService.getAllOrders()).thenReturn(List.of(a, b));

        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("o-1"))
                .andExpect(jsonPath("$[1].status").value("CANCELLED"));
    }
}
