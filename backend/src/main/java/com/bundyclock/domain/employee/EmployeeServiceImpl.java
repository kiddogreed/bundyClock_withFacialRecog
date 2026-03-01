package com.bundyclock.domain.employee;

import com.bundyclock.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;

    @Override
    public List<Employee> getAllEmployees() {
        // TODO: Add pagination support
        return employeeRepository.findAll();
    }

    @Override
    public Employee getEmployeeById(UUID id) {
        return employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    @Override
    @Transactional
    public Employee createEmployee(Employee employee) {
        // TODO: validate uniqueness, encode password if needed
        return employeeRepository.save(employee);
    }

    @Override
    @Transactional
    public Employee updateEmployee(UUID id, Employee employee) {
        Employee existing = getEmployeeById(id);
        existing.setName(employee.getName());
        existing.setDepartment(employee.getDepartment());
        existing.setEmail(employee.getEmail());
        return employeeRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteEmployee(UUID id) {
        Employee existing = getEmployeeById(id);
        employeeRepository.delete(existing);
    }

    @Override
    @Transactional
    public Employee updatePhoto(UUID id, MultipartFile photo) throws IOException {
        Employee employee = getEmployeeById(id);
        Path uploadDir = Paths.get("uploads/employee-photos");
        Files.createDirectories(uploadDir);
        String extension = StringUtils.getFilenameExtension(photo.getOriginalFilename());
        String filename = id.toString() + "." + (extension != null ? extension : "jpg");
        Path destination = uploadDir.resolve(filename);
        photo.transferTo(destination);
        employee.setPhotoUrl("/uploads/employee-photos/" + filename);
        return employeeRepository.save(employee);
    }
}
