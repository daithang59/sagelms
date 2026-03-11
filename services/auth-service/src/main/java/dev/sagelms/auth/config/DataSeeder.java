package dev.sagelms.auth.config;

import dev.sagelms.auth.entity.User;
import dev.sagelms.auth.entity.UserRole;
import dev.sagelms.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    CommandLineRunner seedUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            seedIfAbsent(userRepository, passwordEncoder,
                    "admin@sagelms.dev", "Admin123!", "Admin User", UserRole.ADMIN);
            seedIfAbsent(userRepository, passwordEncoder,
                    "instructor@sagelms.dev", "Instructor123!", "Demo Instructor", UserRole.INSTRUCTOR);
            seedIfAbsent(userRepository, passwordEncoder,
                    "student@sagelms.dev", "Student123!", "Demo Student", UserRole.STUDENT);
        };
    }

    private void seedIfAbsent(UserRepository repo, PasswordEncoder encoder,
                              String email, String password, String fullName, UserRole role) {
        if (repo.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setPasswordHash(encoder.encode(password));
            user.setFullName(fullName);
            user.setRole(role);
            repo.save(user);
            log.info("Seeded {} user: {}", role, email);
        }
    }
}
