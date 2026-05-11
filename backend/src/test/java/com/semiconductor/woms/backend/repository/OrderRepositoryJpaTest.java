package com.semiconductor.woms.backend.repository;

import com.semiconductor.woms.backend.model.Order;
import com.semiconductor.woms.backend.model.enums.OrderStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.OptimisticLockException;
import jakarta.persistence.RollbackException;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class OrderRepositoryJpaTest {

    private final OrderRepository orderRepository;
    private final EntityManagerFactory entityManagerFactory;

    @Autowired OrderRepositoryJpaTest(OrderRepository orderRepository, EntityManagerFactory entityManagerFactory) {
        this.orderRepository = orderRepository;
        this.entityManagerFactory = entityManagerFactory;
    }

    private static Order newValidOrder() {
        Order order = new Order();
        order.setFactoryId("FAB-JPA");
        order.setWaferTypeId("WT-JPA");
        order.setCustomerId("CUST-JPA");
        order.setCreatedBy("user-jpa-1");
        order.setQuantity(100);
        // Intentionally leave remainingQuantity null; @PrePersist should set it.
        order.setRemainingQuantity(null);
        order.setCustomerDueDate(LocalDate.now().plusDays(7));
        order.setStatus(OrderStatus.PENDING);
        order.setIsDelayed(false);
        order.setDelayDays(0);
        return order;
    }

    private static boolean isOrCausedBy(Throwable t, Class<? extends Throwable> type) {
        Throwable cur = t;
        while (cur != null) {
            if (type.isInstance(cur)) return true;
            cur = cur.getCause();
        }
        return false;
    }

    @Test
    void prePersist_populatesIdRemainingQuantityAndTimestamps() {
        Order saved = orderRepository.saveAndFlush(newValidOrder());

        assertNotNull(saved.getId());
        assertEquals(100, saved.getRemainingQuantity());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
        assertEquals(0, saved.getVersion());
        assertEquals(OrderStatus.PENDING, saved.getStatus());

        Order reloaded = orderRepository.findById(saved.getId()).orElseThrow();
        assertEquals(saved.getId(), reloaded.getId());
        assertEquals(100, reloaded.getQuantity());
        assertEquals(100, reloaded.getRemainingQuantity());
    }

    @Test
    void save_missingRequiredField_throwsDataIntegrityViolation() {
        Order invalid = newValidOrder();
        invalid.setCustomerId(null);

        assertThrows(DataIntegrityViolationException.class, () -> {
            orderRepository.save(invalid);
            orderRepository.flush();
        });
    }

    @Test
    void queryMethods_workWithBooleanAndEnums() {
        Order a = newValidOrder();
        a.setCustomerId("CUST-A");
        a.setIsDelayed(true);
        a.setDelayDays(3);

        Order b = newValidOrder();
        b.setCustomerId("CUST-B");
        b.setIsDelayed(false);
        b.setDelayDays(0);
        b.setStatus(OrderStatus.SCHEDULED);

        orderRepository.saveAllAndFlush(List.of(a, b));

        List<Order> delayed = orderRepository.findByIsDelayedTrue();
        assertEquals(1, delayed.size());
        assertEquals("CUST-A", delayed.get(0).getCustomerId());

        List<Order> scheduled = orderRepository.findByStatus(OrderStatus.SCHEDULED);
        assertEquals(1, scheduled.size());
        assertEquals("CUST-B", scheduled.get(0).getCustomerId());
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void optimisticLocking_preventsLostUpdate() {
        // Use two independent persistence contexts to simulate concurrent updates.
        String id;

        EntityManager em0 = entityManagerFactory.createEntityManager();
        em0.getTransaction().begin();
        Order seed = newValidOrder();
        em0.persist(seed);
        em0.getTransaction().commit();
        id = seed.getId();
        em0.close();

        EntityManager em1 = entityManagerFactory.createEntityManager();
        EntityManager em2 = entityManagerFactory.createEntityManager();
        try {
            em1.getTransaction().begin();
            em2.getTransaction().begin();

            Order o1 = em1.find(Order.class, id);
            Order o2 = em2.find(Order.class, id);

            o1.setScheduleWarning("first update");
            em1.flush();
            em1.getTransaction().commit();

            o2.setScheduleWarning("second update");
            Throwable thrown = assertThrows(Throwable.class, () -> {
                em2.flush();
                em2.getTransaction().commit();
            });
            assertTrue(
                    isOrCausedBy(thrown, OptimisticLockException.class) || isOrCausedBy(thrown, RollbackException.class),
                    "Expected optimistic locking failure but got: " + thrown
            );
        } finally {
            if (em1.getTransaction().isActive()) em1.getTransaction().rollback();
            if (em2.getTransaction().isActive()) em2.getTransaction().rollback();
            em1.close();
            em2.close();
        }
    }
}

