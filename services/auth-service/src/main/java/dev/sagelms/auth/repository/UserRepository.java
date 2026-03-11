package dev.sagelms.auth.repository;

import dev.sagelms.auth.entity.User;
import dev.sagelms.auth.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
        SELECT u FROM User u
        WHERE u.role = :role
          AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
    Page<User> findByRoleAndSearch(
            @Param("role") UserRole role,
            @Param("search") String search,
            Pageable pageable);

    Page<User> findByRole(UserRole role, Pageable pageable);

    @Query("""
        SELECT u FROM User u
        WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
        """)
    Page<User> findBySearch(
            @Param("search") String search,
            Pageable pageable);
}
