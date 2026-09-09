package com.example.AviaryService.controllers;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.AviaryService.services.AlertRecipientService;

// The token-guarded links that go out in confirmation / alert emails. No login
// required (SecurityConfig permits /alerts/confirm, /alerts/decline,
// /alerts/unsubscribe) -- the opaque token in the query string is the auth.
// Returns a tiny standalone HTML page since a person clicks these from an inbox.
@RestController
@RequestMapping("/alerts")
public class AlertPublicController {

    private final AlertRecipientService recipientService;

    public AlertPublicController(AlertRecipientService recipientService) {
        this.recipientService = recipientService;
    }

    @GetMapping(value = "/confirm", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String confirm(@RequestParam(required = false) String token) {
        boolean ok = token != null && recipientService.confirm(token);
        return ok
            ? page("You're confirmed", "You'll now receive maintenance alerts. You can unsubscribe anytime from a link in any alert email.")
            : page("Link not valid", "This confirmation link is invalid or has expired. Ask whoever added you to send a fresh one.");
    }

    @GetMapping(value = "/decline", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String decline(@RequestParam(required = false) String token) {
        boolean ok = token != null && recipientService.decline(token);
        return ok
            ? page("Declined", "No problem. You won't receive maintenance alerts.")
            : page("Link not valid", "This link is invalid or has already been used.");
    }

    @GetMapping(value = "/unsubscribe", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String unsubscribe(@RequestParam(required = false) String token) {
        boolean ok = token != null && recipientService.decline(token);
        return ok
            ? page("Unsubscribed", "You've been removed from these maintenance alerts.")
            : page("Link not valid", "This link is invalid or has already been used.");
    }

    private static String page(String heading, String message) {
        return "<!doctype html><html><head><meta charset=\"utf-8\">"
            + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
            + "<title>" + heading + "</title>"
            + "<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;"
            + "max-width:32rem;margin:4rem auto;padding:0 1.25rem;color:#1c2b36;line-height:1.5}"
            + "h1{font-size:1.35rem}</style></head><body>"
            + "<h1>" + heading + "</h1><p>" + message + "</p></body></html>";
    }
}
