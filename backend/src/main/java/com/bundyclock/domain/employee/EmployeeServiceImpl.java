package com.bundyclock.domain.employee;

import com.bundyclock.common.exception.ResourceNotFoundException;
import com.bundyclock.domain.face.FaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final FaceService faceService;

    @Override
    public Page<Employee> getAllEmployees(Pageable pageable) {
        return employeeRepository.findAll(pageable);
    }

    @Override
    public Employee getEmployeeById(UUID id) {
        return employeeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    @Override
    @Transactional
    public Employee createEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    @Override
    @Transactional
    public Employee updateEmployee(UUID id, Employee employee) {
        Employee existing = getEmployeeById(id);
        existing.setName(employee.getName());
        existing.setDepartment(employee.getDepartment());
        existing.setEmail(employee.getEmail());
        if (employee.getStatus() != null) {
            existing.setStatus(employee.getStatus());
        }
        return employeeRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteEmployee(UUID id) {
        Employee existing = getEmployeeById(id);
        faceService.deleteFaceData(id);
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
