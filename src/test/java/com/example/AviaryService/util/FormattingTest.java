package com.example.AviaryService.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

class FormattingTest {

    @Test
    void roundHours_stripsFloatArtifacts() {
        assertEquals(2.04, Formatting.roundHours(2.0433333333333334));
        assertEquals(2.88, Formatting.roundHours(2.876666666666667));
        assertEquals(2.09, Formatting.roundHours(2.0899999999999999));
        assertEquals(0.0, Formatting.roundHours(0.0));
        assertEquals(1250.5, Formatting.roundHours(1250.5));
    }

    @Test
    void roundHoursOrNull_passesNullThrough() {
        assertNull(Formatting.roundHoursOrNull(null));
        assertEquals(Double.valueOf(2.04), Formatting.roundHoursOrNull(2.0433333333333334));
    }

    @Test
    void formatHours_isCleanForComputedAndWholeValues() {
        assertEquals("2.04", Formatting.formatHours(2.0433333333333334));
        assertEquals("2.88", Formatting.formatHours(2.876666666666667));
        assertEquals("2.5", Formatting.formatHours(2.5));
        assertEquals("2", Formatting.formatHours(2.0));
        assertEquals("100", Formatting.formatHours(100.0));
        assertEquals("0", Formatting.formatHours(0.0));
    }

    @Test
    void buildDateHoursString_roundsTheHoursPart() {
        assertEquals("2026-01-15 2.04",
            Formatting.buildDateHoursString(LocalDate.of(2026, 1, 15), 2.0433333333333334));
        assertEquals("2026-01-15 100",
            Formatting.buildDateHoursString(LocalDate.of(2026, 1, 15), 100.0));
        assertEquals("2026-01-15",
            Formatting.buildDateHoursString(LocalDate.of(2026, 1, 15), null));
    }

    @Test
    void formatCycle_roundsHoursSegment() {
        assertEquals("100 hrs", Formatting.formatCycle(null, null, 100.0));
        assertEquals("3 months / 2.04 hrs", Formatting.formatCycle(3, "MONTHS", 2.0433333333333334));
        assertEquals("", Formatting.formatCycle(null, null, null));
    }
}
