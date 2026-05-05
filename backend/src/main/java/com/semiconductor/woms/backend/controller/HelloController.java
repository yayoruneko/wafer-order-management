package com.semiconductor.woms.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "test api")
public class HelloController {
    @GetMapping("/hello")
    public String hello() {
        return "Wafer Order Management System is running!";
    }
}