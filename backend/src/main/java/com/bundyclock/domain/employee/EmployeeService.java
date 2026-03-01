package com.bundyclock.domain.employee;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public interface EmployeeService {

    List<Employee> getAllEmployees();

    Employee getEmployeeById(UUID id);

    Employee createEmployee(Employee employee);

    Employee updateEmployee(UUID id, Employee employee);

    void deleteEmployee(UUID id);

    Employee updatePhoto(UUID id, MultipartFile photo) throws IOException;
}
