package com.semiconductor.woms.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.semiconductor.woms.backend.dto.OrderRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

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

    @Test
    void createThenList_ordersRoundTrip() throws Exception {
        OrderRequest req = new OrderRequest();
        req.setFactoryId("FAB-INT");
        req.setWaferTypeId("WT-INT");
        req.setCustomerId("CUST-INT");
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
}
