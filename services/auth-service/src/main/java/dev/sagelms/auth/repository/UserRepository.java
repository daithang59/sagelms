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
        WHERE (:role IS NULL OR u.role = :role)
          AND (:search IS NULL
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
    Page<User> findAllWithFilters(
            @Param("role") UserRole role,
            @Param("search") String search,
            Pageable pageable);
}
