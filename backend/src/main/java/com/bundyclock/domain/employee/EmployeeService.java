package com.bundyclock.domain.employee;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

public interface EmployeeService {

    /** Returns a paginated slice of employees (sorted by name ascending by default). */
    Page<Employee> getAllEmployees(Pageable pageable);

    Employee getEmployeeById(UUID id);

    Employee createEmployee(Employee employee);

    Employee updateEmployee(UUID id, Employee employee);

    void deleteEmployee(UUID id);

    Employee updatePhoto(UUID id, MultipartFile photo) throws IOException;
}
