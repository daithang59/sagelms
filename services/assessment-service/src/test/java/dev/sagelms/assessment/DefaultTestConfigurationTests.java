package dev.sagelms.assessment;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

@SpringBootTest
class DefaultTestConfigurationTests {
    @Autowired
    private DataSource dataSource;

    @Autowired
    private Environment environment;

    @Test
    void testsUseInMemoryDatasourceByDefault() throws Exception {
        assertThat(environment.getDefaultProfiles()).contains("test");

        try (var connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getURL()).startsWith("jdbc:h2:mem:");
        }
    }
}
