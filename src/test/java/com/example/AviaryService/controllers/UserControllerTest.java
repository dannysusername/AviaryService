package com.example.AviaryService.controllers;

import com.example.AviaryService.entity.DescriptionOption;
import com.example.AviaryService.entity.ServiceTimeline;
import com.example.AviaryService.entity.User;
import com.example.AviaryService.repositories.DescriptionOptionRepository;
import com.example.AviaryService.repositories.ServiceTimelineRepository;
import com.example.AviaryService.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class UserControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ServiceTimelineRepository serviceTimelineRepository;

    @Mock
    private DescriptionOptionRepository descriptionOptionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testAddTimelineAsTitle() {
        // Arrange
        String username = "testuser";
        User user = new User(username, "encodedPass");
        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(user);
        when(serviceTimelineRepository.findMaxTimelineOrderByUser(user)).thenReturn(5);
        when(serviceTimelineRepository.save(any(ServiceTimeline.class))).thenAnswer(i -> i.getArguments()[0]);
        when(descriptionOptionRepository.findByUser(user)).thenReturn(Collections.emptyList());

        // Act
        String result = userController.addTimeline("Test Item", "true", null, null, null, null, null, authentication);

        // Assert
        verify(serviceTimelineRepository).save(argThat(timeline -> 
            timeline.getItem().equals("Test Item") &&
            timeline.isTitle() &&
            timeline.getTimelineOrder() == 6 &&
            timeline.getUser() == user
        ));
        verify(descriptionOptionRepository, never()).save(any(DescriptionOption.class)); // No description, so not called
        assertEquals("redirect:/dashboard", result);
    }

    @Test
    void testAddTimelineWithDescription() {
        // Arrange
        String username = "testuser";
        User user = new User(username, "encodedPass");
        when(authentication.getName()).thenReturn(username);
        when(userRepository.findByUsername(username)).thenReturn(user);
        when(serviceTimelineRepository.findMaxTimelineOrderByUser(user)).thenReturn(null);
        when(serviceTimelineRepository.save(any(ServiceTimeline.class))).thenAnswer(i -> i.getArguments()[0]);
        when(descriptionOptionRepository.findByUser(user)).thenReturn(Collections.emptyList());
        when(descriptionOptionRepository.save(any(DescriptionOption.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        String result = userController.addTimeline("Item", "false", "Custom Desc", "Weekly", "2023-01-01", "2023-01-08", "7 days", authentication);

        // Assert
        verify(serviceTimelineRepository).save(argThat(timeline -> 
            !timeline.isTitle() &&
            timeline.getItem().equals("Item") &&
            timeline.getDescription().equals("Custom Desc") &&
            timeline.getCycle().equals("Weekly") &&
            timeline.getTimelineOrder() == 0
        ));
        verify(descriptionOptionRepository).save(argThat(option -> 
            option.getOption().equals("Custom Desc") &&
            option.getUser() == user
        ));
        assertEquals("redirect:/dashboard", result);
    }
}