package com.example.AviaryService.services;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import com.example.AviaryService.entity.FlightLog;
import com.example.AviaryService.entity.ServiceTimeline;
import com.example.AviaryService.entity.User;
import com.example.AviaryService.repositories.FlightLogRepository;
import com.example.AviaryService.repositories.ServiceTimelineRepository;
import com.example.AviaryService.util.Formatting;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

// Renders templates/pdf-export.html to real PDF bytes via openhtmltopdf --
// see docs/SHARE_EXPORT_SPEC.md. Replaced an earlier client-side
// html2canvas+jsPDF approach that screenshotted the dashboard: that produced
// huge rasterized pages that scrolled badly in PDF viewers. This produces
// real vector text/tables instead.
@Service
public class PdfExportService {

    private final ITemplateEngine templateEngine;
    private final ServiceTimelineRepository serviceTimelineRepository;
    private final FlightLogRepository flightLogRepository;

    public PdfExportService(ITemplateEngine templateEngine,
            ServiceTimelineRepository serviceTimelineRepository,
            FlightLogRepository flightLogRepository) {
        this.templateEngine = templateEngine;
        this.serviceTimelineRepository = serviceTimelineRepository;
        this.flightLogRepository = flightLogRepository;
    }

    public byte[] generateDashboardPdf(User user) {
        Context context = new Context();
        context.setVariable("makeModel", user.getMakeModel());
        context.setVariable("tailNumber", user.getTailNumber());
        context.setVariable("ownerName", user.getOwnerName());
        context.setVariable("makeModelSN", user.getMakeModelSN());
        context.setVariable("blockTimeHours", formatHoursOrBlank(user.getBlockTimeHours()));
        context.setVariable("timeInServiceHours", formatHoursOrBlank(user.getTimeInServiceHours()));
        context.setVariable("generatedAt", DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a")
            .withZone(ZoneOffset.UTC).format(Instant.now()) + " UTC");
        context.setVariable("timelineRows", buildTimelineRows(user));
        context.setVariable("logRows", buildLogRows(user));

        String html = templateEngine.process("pdf-export", context);
        return renderPdf(html);
    }

    // openhtmltopdf-pdfbox parses its input as XML, not HTML5 -- feed it the
    // Thymeleaf output directly since pdf-export.html is hand-written as
    // well-formed XHTML for exactly this reason.
    private byte[] renderPdf(String html) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(outputStream);
            builder.run();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    private List<Map<String, Object>> buildTimelineRows(User user) {
        return serviceTimelineRepository.findByUserOrderByTimelineOrderAsc(user).stream()
            .map(this::timelineRowData)
            .collect(Collectors.toList());
    }

    private Map<String, Object> timelineRowData(ServiceTimeline t) {
        Map<String, Object> row = new HashMap<>();
        row.put("isTitle", t.getIsTitle());
        row.put("item", t.getItem());
        row.put("description", t.getDescription());
        row.put("cycle", Formatting.formatCycle(t.getCycleCalendarValue(), t.getCycleCalendarUnit(), t.getCycleHours()));
        row.put("lastDone", joinNonBlank(t.getLastDoneDate(), t.getLastDoneHours()));
        row.put("dueDate", joinNonBlank(t.getDueDateDate(), t.getDueDateHours()));
        row.put("timeLeft", t.getTimeLeft());
        return row;
    }

    private List<Map<String, Object>> buildLogRows(User user) {
        List<FlightLog> logs = flightLogRepository.findByUser(user).stream()
            .sorted(Comparator
                .<FlightLog, Instant>comparing(log -> {
                    Instant start = log.getBlockTimeStart() != null ? log.getBlockTimeStart() : log.getTimeInServiceStart();
                    return start == null ? Instant.MAX : start;
                })
                .thenComparing(FlightLog::getId))
            .toList();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (FlightLog log : logs) {
            Map<String, Object> row = new HashMap<>();
            row.put("fromAirport", log.getFromAirport());
            row.put("toAirport", log.getToAirport());
            row.put("blockTimeOut", formatHoursOrBlank(log.getBlockTimeOut()));
            row.put("blockTimeIn", formatHoursOrBlank(log.getBlockTimeIn()));
            row.put("timeInServiceOut", formatHoursOrBlank(log.getTimeInServiceOut()));
            row.put("timeInServiceIn", formatHoursOrBlank(log.getTimeInServiceIn()));
            rows.add(row);
        }
        return rows;
    }

    private static String formatHoursOrBlank(Double hours) {
        if (hours == null) return "";
        return Formatting.formatHours(hours);
    }

    private static String joinNonBlank(String a, String b) {
        return Stream.of(a, b).filter(s -> s != null && !s.isEmpty()).collect(Collectors.joining(" "));
    }
}
