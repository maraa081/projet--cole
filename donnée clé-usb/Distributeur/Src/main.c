/**
 * main.c - Distributeur de boissons gazeuses
 * STM32L412KBUx - NUCLEO-L412KB
 * ZERO dépendance externe - pas de HAL, pas de CMSIS
 *
 * BRANCHEMENTS :
 *   SGP30 VCC -> 3.3V
 *   SGP30 GND -> GND
 *   SGP30 SDA -> D4 (PB7)
 *   SGP30 SCL -> D5 (PB6)
 *   UART TX   -> PA2 (USB ST-LINK, 115200 bauds)
 */

#include <stdint.h>
#include <string.h>
#include <stdio.h>

/* ===========================================================
 * Adresses de base des périphériques STM32L412KBUx
 * =========================================================== */
#define PERIPH_BASE       0x40000000UL
#define APB1_BASE         (PERIPH_BASE + 0x00000000UL)
#define APB2_BASE         (PERIPH_BASE + 0x00010000UL)
#define AHB1_BASE         (PERIPH_BASE + 0x00020000UL)
#define AHB2_BASE         (PERIPH_BASE + 0x08000000UL)

/* RCC */
#define RCC_BASE          (AHB1_BASE + 0x1000UL)
#define RCC_AHB2ENR       (*(volatile uint32_t*)(RCC_BASE + 0x4CUL))
#define RCC_APB1ENR1      (*(volatile uint32_t*)(RCC_BASE + 0x58UL))

/* GPIOA */
#define GPIOA_BASE        (AHB2_BASE + 0x0000UL)
#define GPIOA_MODER       (*(volatile uint32_t*)(GPIOA_BASE + 0x00))
#define GPIOA_OTYPER      (*(volatile uint32_t*)(GPIOA_BASE + 0x04))
#define GPIOA_OSPEEDR     (*(volatile uint32_t*)(GPIOA_BASE + 0x08))
#define GPIOA_PUPDR       (*(volatile uint32_t*)(GPIOA_BASE + 0x0C))
#define GPIOA_ODR         (*(volatile uint32_t*)(GPIOA_BASE + 0x14))
#define GPIOA_AFRL        (*(volatile uint32_t*)(GPIOA_BASE + 0x20))

/* GPIOB */
#define GPIOB_BASE        (AHB2_BASE + 0x0400UL)
#define GPIOB_MODER       (*(volatile uint32_t*)(GPIOB_BASE + 0x00))
#define GPIOB_OTYPER      (*(volatile uint32_t*)(GPIOB_BASE + 0x04))
#define GPIOB_OSPEEDR     (*(volatile uint32_t*)(GPIOB_BASE + 0x08))
#define GPIOB_PUPDR       (*(volatile uint32_t*)(GPIOB_BASE + 0x0C))
#define GPIOB_ODR         (*(volatile uint32_t*)(GPIOB_BASE + 0x14))
#define GPIOB_AFRL        (*(volatile uint32_t*)(GPIOB_BASE + 0x20))

/* USART2 */
#define USART2_BASE       (APB1_BASE + 0x4400UL)
#define USART2_CR1        (*(volatile uint32_t*)(USART2_BASE + 0x00))
#define USART2_BRR        (*(volatile uint32_t*)(USART2_BASE + 0x0C))
#define USART2_ISR        (*(volatile uint32_t*)(USART2_BASE + 0x1C))
#define USART2_TDR        (*(volatile uint32_t*)(USART2_BASE + 0x28))

/* I2C1 */
#define I2C1_BASE         (APB1_BASE + 0x5400UL)
#define I2C1_CR1          (*(volatile uint32_t*)(I2C1_BASE + 0x00))
#define I2C1_CR2          (*(volatile uint32_t*)(I2C1_BASE + 0x04))
#define I2C1_TIMINGR      (*(volatile uint32_t*)(I2C1_BASE + 0x10))
#define I2C1_ISR          (*(volatile uint32_t*)(I2C1_BASE + 0x18))
#define I2C1_ICR          (*(volatile uint32_t*)(I2C1_BASE + 0x1C))
#define I2C1_TXDR         (*(volatile uint32_t*)(I2C1_BASE + 0x28))
#define I2C1_RXDR         (*(volatile uint32_t*)(I2C1_BASE + 0x24))

/* Bits utiles */
#define USART_CR1_UE      (1U << 0)
#define USART_CR1_TE      (1U << 3)
#define USART_ISR_TXE     (1U << 7)
#define USART_ISR_TC      (1U << 6)

#define I2C_CR1_PE        (1U << 0)
#define I2C_CR2_AUTOEND   (1U << 25)
#define I2C_CR2_START     (1U << 13)
#define I2C_CR2_STOP      (1U << 14)
#define I2C_CR2_RD_WRN    (1U << 10)
#define I2C_CR2_NACK      (1U << 15)
#define I2C_ISR_TXIS      (1U << 1)
#define I2C_ISR_RXNE      (1U << 2)
#define I2C_ISR_NACKF     (1U << 4)
#define I2C_ISR_STOPF     (1U << 5)
#define I2C_ISR_TC        (1U << 6)
#define I2C_ICR_STOPCF    (1U << 5)
#define I2C_ICR_NACKCF    (1U << 4)

/* RCC bits */
#define RCC_AHB2ENR_GPIOAEN  (1U << 0)
#define RCC_AHB2ENR_GPIOBEN  (1U << 1)
#define RCC_APB1ENR1_USART2EN (1U << 17)
#define RCC_APB1ENR1_I2C1EN  (1U << 21)

/* ===========================================================
 * Délai simple
 * =========================================================== */
static void delay_ms(uint32_t ms) {
    /* ~4 MHz MSI par défaut → ~400 cycles/ms */
    volatile uint32_t n = ms * 400;
    while (n--) __asm__("nop");
}

/* ===========================================================
 * UART2 - PA2 = TX (AF7)
 * =========================================================== */
static void uart_init(void) {
    RCC_AHB2ENR  |= RCC_AHB2ENR_GPIOAEN;
    RCC_APB1ENR1 |= RCC_APB1ENR1_USART2EN;

    /* PA2 → AF mode */
    GPIOA_MODER &= ~(3U << (2*2));
    GPIOA_MODER |=  (2U << (2*2));
    /* AF7 sur PA2 */
    GPIOA_AFRL  &= ~(0xFU << (2*4));
    GPIOA_AFRL  |=  (7U   << (2*4));

    /* 115200 @ 4 MHz MSI */
    USART2_BRR = 4000000U / 115200U;
    USART2_CR1 = USART_CR1_TE | USART_CR1_UE;
}

static void uart_putc(char c) {
    while (!(USART2_ISR & USART_ISR_TXE));
    USART2_TDR = (uint8_t)c;
}

static void uart_puts(const char *s) {
    while (*s) uart_putc(*s++);
}

/* ===========================================================
 * I2C1 - PB6=SCL, PB7=SDA (AF4), open-drain
 * =========================================================== */
static void i2c_init(void) {
    RCC_AHB2ENR  |= RCC_AHB2ENR_GPIOBEN;
    RCC_APB1ENR1 |= RCC_APB1ENR1_I2C1EN;

    /* PB6, PB7 → Alternate Function */
    GPIOB_MODER &= ~((3U << (6*2)) | (3U << (7*2)));
    GPIOB_MODER |=  ((2U << (6*2)) | (2U << (7*2)));
    /* Open-drain */
    GPIOB_OTYPER |= (1U << 6) | (1U << 7);
    /* Vitesse haute */
    GPIOB_OSPEEDR |= (3U << (6*2)) | (3U << (7*2));
    /* AF4 = I2C1 */
    GPIOB_AFRL &= ~((0xFU << (6*4)) | (0xFU << (7*4)));
    GPIOB_AFRL |=  ((4U  << (6*4)) | (4U  << (7*4)));

    I2C1_CR1    = 0;
    /* TIMINGR pour 100 kHz @ 4 MHz MSI */
    I2C1_TIMINGR = 0x00100D14UL;
    I2C1_CR1    = I2C_CR1_PE;
}

static int i2c_write(uint8_t addr7, const uint8_t *data, uint8_t len) {
    uint32_t t;
    I2C1_CR2 = (uint32_t)(addr7 << 1)
             | ((uint32_t)len << 16)
             | I2C_CR2_AUTOEND;
    I2C1_CR2 |= I2C_CR2_START;

    for (uint8_t i = 0; i < len; i++) {
        t = 50000;
        while (!(I2C1_ISR & I2C_ISR_TXIS)) {
            if (--t == 0 || (I2C1_ISR & I2C_ISR_NACKF)) {
                I2C1_ICR = I2C_ICR_NACKCF | I2C_ICR_STOPCF;
                return -1;
            }
        }
        I2C1_TXDR = data[i];
    }
    t = 50000;
    while (!(I2C1_ISR & I2C_ISR_STOPF)) {
        if (--t == 0) return -1;
    }
    I2C1_ICR = I2C_ICR_STOPCF;
    return 0;
}

static int i2c_read(uint8_t addr7, uint8_t *buf, uint8_t len) {
    uint32_t t;
    I2C1_CR2 = (uint32_t)(addr7 << 1)
             | ((uint32_t)len << 16)
             | I2C_CR2_RD_WRN
             | I2C_CR2_AUTOEND;
    I2C1_CR2 |= I2C_CR2_START;

    for (uint8_t i = 0; i < len; i++) {
        t = 50000;
        while (!(I2C1_ISR & I2C_ISR_RXNE)) {
            if (--t == 0) return -1;
        }
        buf[i] = (uint8_t)I2C1_RXDR;
    }
    t = 50000;
    while (!(I2C1_ISR & I2C_ISR_STOPF)) {
        if (--t == 0) return -1;
    }
    I2C1_ICR = I2C_ICR_STOPCF;
    return 0;
}

/* ===========================================================
 * LED - PB3
 * =========================================================== */
static void led_init(void) {
    RCC_AHB2ENR |= RCC_AHB2ENR_GPIOBEN;
    GPIOB_MODER &= ~(3U << (3*2));
    GPIOB_MODER |=  (1U << (3*2));
}
static void led_on(void)     { GPIOB_ODR |=  (1U << 3); }
static void led_off(void)    { GPIOB_ODR &= ~(1U << 3); }
static void led_toggle(void) { GPIOB_ODR ^=  (1U << 3); }

/* ===========================================================
 * SGP30 - adresse 0x58
 * =========================================================== */
#define SGP30_ADDR 0x58U

static uint8_t sgp30_crc(const uint8_t *d, uint8_t len) {
    uint8_t crc = 0xFF;
    for (uint8_t i = 0; i < len; i++) {
        crc ^= d[i];
        for (uint8_t b = 0; b < 8; b++)
            crc = (crc & 0x80) ? (crc << 1) ^ 0x31 : (crc << 1);
    }
    return crc;
}

static int sgp30_init(void) {
    uint8_t cmd[2] = {0x20, 0x03};
    if (i2c_write(SGP30_ADDR, cmd, 2) != 0) return -1;
    delay_ms(10);
    return 0;
}

static int sgp30_read(uint16_t *eco2, uint16_t *tvoc) {
    uint8_t cmd[2] = {0x20, 0x08};
    uint8_t rx[6];

    if (i2c_write(SGP30_ADDR, cmd, 2) != 0) return -1;
    delay_ms(12);
    if (i2c_read(SGP30_ADDR, rx, 6) != 0) return -1;

    if (sgp30_crc(rx,   2) != rx[2]) return -2;
    if (sgp30_crc(rx+3, 2) != rx[5]) return -2;

    *eco2 = ((uint16_t)rx[0] << 8) | rx[1];
    *tvoc = ((uint16_t)rx[3] << 8) | rx[4];
    return 0;
}

/* ===========================================================
 * Statut
 * =========================================================== */
static const char* get_status(uint16_t tvoc, uint16_t eco2) {
    if (tvoc > 2000 || eco2 > 5000) return "DANGER";
    if (tvoc > 500  || eco2 > 2000) return "ALERTE";
    if (tvoc < 10   && eco2 < 420)  return "INIT";
    return "OK";
}

/* ===========================================================
 * MAIN
 * =========================================================== */
int main(void) {
    led_init();
    uart_init();
    i2c_init();

    delay_ms(200);
    uart_puts("{\"boot\":true}\r\n");

    led_off();

    if (sgp30_init() != 0) {
        uart_puts("{\"error\":\"SGP30 non detecte\"}\r\n");
        while (1) { led_toggle(); delay_ms(100); }
    }

    uart_puts("{\"info\":\"SGP30 OK - chauffe 15s\"}\r\n");
    for (int i = 0; i < 15; i++) {
        led_toggle();
        delay_ms(1000);
    }

    uint16_t tvoc = 0, eco2 = 0;
    uint32_t sample = 0;
    char buf[128];

    while (1) {
        int ret = sgp30_read(&eco2, &tvoc);

        if (ret == 0) {
            const char *st = get_status(tvoc, eco2);
            int n = snprintf(buf, sizeof(buf),
                "{\"id\":%lu,\"tvoc\":%u,\"eco2\":%u,\"status\":\"%s\"}\r\n",
                (unsigned long)sample, tvoc, eco2, st);
            (void)n;
            uart_puts(buf);
            led_toggle();
        } else {
            uart_puts("{\"error\":\"lecture SGP30\"}\r\n");
            led_off();
        }

        sample++;
        delay_ms(1000);
    }

    return 0;
}
