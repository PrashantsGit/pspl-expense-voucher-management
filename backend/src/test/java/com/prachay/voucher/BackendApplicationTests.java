package com.prachay.voucher;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "app.jwt.secret=TestSecretKeyThatIsAtLeast256BitsLongForTestingPurposes123456"
})
class BackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
