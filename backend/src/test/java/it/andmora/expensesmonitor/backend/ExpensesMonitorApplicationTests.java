package it.andmora.expensesmonitor.backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
class ExpensesMonitorApplicationTests {

	@Test
	void contextLoads() {
		assertThat(true).isTrue();
	}

}
