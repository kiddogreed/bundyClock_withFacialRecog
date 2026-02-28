package com.bundyclock.domain.employee;

import com.bundyclock.common.exception.ResourceNotFoundException;
import com.bundyclock.config.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for {@link EmployeeController} using MockMvc (no full Spring context).
 *
 * <p>The service layer is replaced with a Mockito mock so that tests are fast,
 * isolated, and do not require a running database.
 */
@WebMvcTest(EmployeeController.class)
@Import(SecurityConfig.class)
@DisplayName("EmployeeController")
@WithMockUser
class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EmployeeService employeeService;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Employee sampleEmployee(UUID id) {
        return Employee.builder()
                .id(id)
                .name("Alice Reyes")
                .employeeCode("EMP-001")
                .department("Engineering")
                .email("alice@example.com")
                .build();
    }

    // -------------------------------------------------------------------------
    // GET /api/employees
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/employees")
    class GetAllEmployees {

        @Test
        @DisplayName("returns 200 with list of employees")
        void returnsAllEmployees() throws Exception {
            UUID id = UUID.randomUUID();
            when(employeeService.getAllEmployees()).thenReturn(List.of(sampleEmployee(id)));

            mockMvc.perform(get("/api/employees"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].name").value("Alice Reyes"))
                    .andExpect(jsonPath("$.data[0].employeeCode").value("EMP-001"));
        }

        @Test
        @DisplayName("returns 200 with empty list when no employees exist")
        void returnsEmptyList() throws Exception {
            when(employeeService.getAllEmployees()).thenReturn(List.of());

            mockMvc.perform(get("/api/employees"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/employees/{id}
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/employees/{id}")
    class GetEmployeeById {

        @Test
        @DisplayName("returns 200 with the requested employee")
        void returnsEmployee() throws Exception {
            UUID id = UUID.randomUUID();
            when(employeeService.getEmployeeById(id)).thenReturn(sampleEmployee(id));

            mockMvc.perform(get("/api/employees/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(id.toString()))
                    .andExpect(jsonPath("$.data.name").value("Alice Reyes"));
        }

        @Test
        @DisplayName("returns 404 when employee is not found")
        void returns404WhenNotFound() throws Exception {
            UUID id = UUID.randomUUID();
            when(employeeService.getEmployeeById(id))
                    .thenThrow(new ResourceNotFoundException("Employee not found"));

            mockMvc.perform(get("/api/employees/{id}", id))
                    .andExpect(status().isNotFound());
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/employees
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/employees")
    class CreateEmployee {

        @Test
        @DisplayName("returns 201 with created employee")
        void createsEmployee() throws Exception {
            UUID id = UUID.randomUUID();
            Employee input = Employee.builder()
                    .name("Bob Cruz")
                    .employeeCode("EMP-002")
                    .department("HR")
                    .email("bob@example.com")
                    .build();
            Employee saved = Employee.builder()
                    .id(id)
                    .name("Bob Cruz")
                    .employeeCode("EMP-002")
                    .department("HR")
                    .email("bob@example.com")
                    .build();
            when(employeeService.createEmployee(any(Employee.class))).thenReturn(saved);

            mockMvc.perform(post("/api/employees")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(input)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Employee created"))
                    .andExpect(jsonPath("$.data.id").value(id.toString()))
                    .andExpect(jsonPath("$.data.name").value("Bob Cruz"));
        }
    }

    // -------------------------------------------------------------------------
    // PUT /api/employees/{id}
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/employees/{id}")
    class UpdateEmployee {

        @Test
        @DisplayName("returns 200 with updated employee")
        void updatesEmployee() throws Exception {
            UUID id = UUID.randomUUID();
            Employee update = Employee.builder()
                    .name("Alice Santos")
                    .employeeCode("EMP-001")
                    .department("QA")
                    .email("alice@example.com")
                    .build();
            Employee updated = Employee.builder()
                    .id(id)
                    .name("Alice Santos")
                    .employeeCode("EMP-001")
                    .department("QA")
                    .email("alice@example.com")
                    .build();
            when(employeeService.updateEmployee(eq(id), any(Employee.class))).thenReturn(updated);

            mockMvc.perform(put("/api/employees/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(update)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Employee updated"))
                    .andExpect(jsonPath("$.data.department").value("QA"));
        }

        @Test
        @DisplayName("returns 404 when updating a non-existent employee")
        void returns404WhenNotFound() throws Exception {
            UUID id = UUID.randomUUID();
            when(employeeService.updateEmployee(eq(id), any(Employee.class)))
                    .thenThrow(new ResourceNotFoundException("Employee not found"));

            mockMvc.perform(put("/api/employees/{id}", id)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(sampleEmployee(id))))
                    .andExpect(status().isNotFound());
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/employees/{id}
    // -------------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/employees/{id}")
    class DeleteEmployee {

        @Test
        @DisplayName("returns 200 with success message")
        void deletesEmployee() throws Exception {
            UUID id = UUID.randomUUID();
            doNothing().when(employeeService).deleteEmployee(id);

            mockMvc.perform(delete("/api/employees/{id}", id))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Employee deleted"));

            verify(employeeService, times(1)).deleteEmployee(id);
        }

        @Test
        @DisplayName("returns 404 when deleting a non-existent employee")
        void returns404WhenNotFound() throws Exception {
            UUID id = UUID.randomUUID();
            doThrow(new ResourceNotFoundException("Employee not found"))
                    .when(employeeService).deleteEmployee(id);

            mockMvc.perform(delete("/api/employees/{id}", id))
                    .andExpect(status().isNotFound());
        }
    }
}
