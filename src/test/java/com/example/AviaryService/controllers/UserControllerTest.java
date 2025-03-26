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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
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

    private List<User> fakeUsers;
    private List<ServiceTimeline> allTimelines;

    @BeforeEach
void setUp() {
    MockitoAnnotations.openMocks(this);
    fakeUsers = new ArrayList<>();
    allTimelines = new ArrayList<>();

    // Create 50 fake users
    for (int i = 1; i <= 50; i++) {
        User user = new User();
        user.setId((long) i);
        user.setUsername("user" + i);
        user.setPassword("password" + i); // In a real scenario, this would be encoded
        fakeUsers.add(user);
    }

    // Mock userRepository.findByUsername
    for (User user : fakeUsers) {
        when(userRepository.findByUsername(user.getUsername())).thenReturn(user);
    }

    // Create 2 timelines per user
    for (User user : fakeUsers) {
        for (int j = 1; j <= 2; j++) {
            ServiceTimeline timeline = new ServiceTimeline();
            timeline.setId((long) allTimelines.size() + 1);
            timeline.setUser(user);
            timeline.setItem("Timeline " + j + " for " + user.getUsername());
            timeline.setIsTitle(false);
            timeline.setTimelineOrder(j);
            // Add other fields like description, createdDate, etc., as needed
            allTimelines.add(timeline);
        }
    }

    // Mock serviceTimelineRepository.findByUserOrderByIdAsc
    for (User user : fakeUsers) {
        List<ServiceTimeline> userTimelines = allTimelines.stream()
                .filter(t -> t.getUser().equals(user))
                .toList();
        when(serviceTimelineRepository.findByUserOrderByIdAsc(user)).thenReturn(userTimelines);
    }

    // Mock descriptionOptionRepository.findByUser to return an empty list
    when(descriptionOptionRepository.findByUser(any(User.class))).thenReturn(new ArrayList<>());
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