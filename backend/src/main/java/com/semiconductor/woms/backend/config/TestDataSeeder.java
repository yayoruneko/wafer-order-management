package com.semiconductor.woms.backend.config;

import com.semiconductor.woms.backend.model.Customer;
import com.semiconductor.woms.backend.model.User;
import com.semiconductor.woms.backend.model.enums.UserType;
import com.semiconductor.woms.backend.repository.CustomerRepository;
import com.semiconductor.woms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Seeds test fixtures (user + customers) needed by the frontend integration
 * tests. Only active when the "test" Spring profile is enabled.
 */
@Component
@Profile("test")
public class TestDataSeeder implements ApplicationRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        seedUser();
        seedCustomers();
    }

    private void seedUser() {
        if (userRepository.findByUsername("test.admin").isEmpty()) {
            User user = new User();
            user.setId("test-admin-seed-001");
            user.setUsername("test.admin");
            user.setPasswordHash(passwordEncoder.encode("Test1234!"));
            user.setRole(UserType.ADMIN);
            user.setCreatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    private void seedCustomers() {
        if (!customerRepository.existsById("customer-001")) {
            Customer c = new Customer();
            c.setId("customer-001");
            c.setCustomerCode("CUST-NV");
            c.setName("NVIDIA Taiwan");
            c.setIsActive(true);
            customerRepository.save(c);
        }
        if (!customerRepository.existsById("customer-002")) {
            Customer c = new Customer();
            c.setId("customer-002");
            c.setCustomerCode("CUST-AP");
            c.setName("Apple Inc.");
            c.setIsActive(true);
            customerRepository.save(c);
        }
    }
}
