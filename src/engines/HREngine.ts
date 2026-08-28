import { Employee, Payslip, FiscalCountry, PaymentMethod } from '../types/pulse';
import { EventBus } from './EventBus';

export class HREngine {
  private employees: Map<string, Employee> = new Map();
  private payslips: Payslip[] = [];
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.initializeDefaultEmployees();
  }

  private initializeDefaultEmployees() {
    const defaults: Employee[] = [
      {
        id: 'emp_01',
        tenantId: 'tenant_luanda_01',
        name: 'Manuel António de Oliveira',
        taxId: '102938475LA03',
        socialSecurityNumber: 'SS-AO-99201',
        role: 'Responsável de Armazém & Logística',
        department: 'Operações',
        baseSalary: 280000,
        foodAllowance: 35000,
        transportAllowance: 30000,
        contractType: 'PERMANENT',
        startDate: '2023-02-01',
        active: true,
      },
      {
        id: 'emp_02',
        tenantId: 'tenant_luanda_01',
        name: 'Esperança Santos Silva',
        taxId: '593820194LA01',
        socialSecurityNumber: 'SS-AO-88402',
        role: 'Operadora de Caixa Sénior',
        department: 'Vendas & POS',
        baseSalary: 195000,
        foodAllowance: 30000,
        transportAllowance: 25000,
        contractType: 'PERMANENT',
        startDate: '2023-06-15',
        active: true,
      },
      {
        id: 'emp_03',
        tenantId: 'tenant_luanda_01',
        name: 'Carlos Mateus Gonçalves',
        taxId: '772910382LA09',
        socialSecurityNumber: 'SS-AO-77310',
        role: 'Técnico de Manutenção & Café Barista',
        department: 'Produção',
        baseSalary: 160000,
        foodAllowance: 25000,
        transportAllowance: 25000,
        contractType: 'FIXED_TERM',
        startDate: '2024-01-10',
        active: true,
      },
    ];

    defaults.forEach((emp) => this.employees.set(emp.id, emp));
  }

  public getEmployees(tenantId?: string): Employee[] {
    const list = Array.from(this.employees.values());
    if (tenantId) {
      return list.filter((e) => e.tenantId === tenantId);
    }
    return list;
  }

  public getEmployee(id: string): Employee | undefined {
    return this.employees.get(id);
  }

  public addEmployee(emp: Employee): Employee {
    this.employees.set(emp.id, emp);
    return emp;
  }

  public updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const existing = this.employees.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.employees.set(id, updated);
    return updated;
  }

  public getPayslips(tenantId?: string): Payslip[] {
    if (tenantId) {
      return this.payslips.filter((p) => p.tenantId === tenantId);
    }
    return [...this.payslips];
  }

  /**
   * Calculate statutory taxes (Angola IRT/INSS, Portugal IRS/SS)
   */
  public calculatePayroll(employee: Employee, country: FiscalCountry): {
    grossTotal: number;
    irtDeduction: number;
    ssEmployee: number;
    ssCompany: number;
    netSalary: number;
  } {
    const allowances = employee.foodAllowance + employee.transportAllowance;
    const grossTotal = employee.baseSalary + allowances;

    let ssEmployee = 0;
    let ssCompany = 0;
    let irtDeduction = 0;

    if (country === 'AO') {
      // Angola INSS: 3% employee, 8% employer
      ssEmployee = Math.round(employee.baseSalary * 0.03);
      ssCompany = Math.round(employee.baseSalary * 0.08);

      // Angola IRT Progressive Tax simulation on taxable income
      const taxableBase = employee.baseSalary - ssEmployee;
      if (taxableBase <= 100000) {
        irtDeduction = 0;
      } else if (taxableBase <= 200000) {
        irtDeduction = Math.round((taxableBase - 100000) * 0.13);
      } else if (taxableBase <= 300000) {
        irtDeduction = Math.round(13000 + (taxableBase - 200000) * 0.16);
      } else {
        irtDeduction = Math.round(29000 + (taxableBase - 300000) * 0.19);
      }
    } else if (country === 'PT') {
      // Portugal SS: 11% employee, 23.75% company
      ssEmployee = Math.round(employee.baseSalary * 0.11);
      ssCompany = Math.round(employee.baseSalary * 0.2375);
      // Average IRS retention
      irtDeduction = Math.round(employee.baseSalary * 0.14);
    } else {
      // Standard 3% SS, 10% Flat IRT
      ssEmployee = Math.round(employee.baseSalary * 0.03);
      ssCompany = Math.round(employee.baseSalary * 0.04);
      irtDeduction = Math.round(employee.baseSalary * 0.1);
    }

    const netSalary = grossTotal - ssEmployee - irtDeduction;

    return {
      grossTotal,
      irtDeduction,
      ssEmployee,
      ssCompany,
      netSalary,
    };
  }

  /**
   * Process monthly payroll for an employee and publish the system event
   */
  public processEmployeePayroll(
    employeeId: string,
    period: string,
    country: FiscalCountry,
    paymentMethod: PaymentMethod = 'BANK_TRANSFER'
  ): Payslip | null {
    const employee = this.employees.get(employeeId);
    if (!employee || !employee.active) return null;

    const calc = this.calculatePayroll(employee, country);

    const payslip: Payslip = {
      id: `pay_${Date.now()}_${employee.id}`,
      tenantId: employee.tenantId,
      employeeId: employee.id,
      employeeName: employee.name,
      period,
      baseSalary: employee.baseSalary,
      allowances: employee.foodAllowance + employee.transportAllowance,
      grossTotal: calc.grossTotal,
      irtDeduction: calc.irtDeduction,
      socialSecurityEmployee: calc.ssEmployee,
      socialSecurityCompany: calc.ssCompany,
      netSalary: calc.netSalary,
      status: 'PAID',
      processedAt: new Date().toISOString(),
      paymentMethod,
    };

    this.payslips.unshift(payslip);

    this.eventBus.publish({
      eventType: 'PAYMENT_SENT',
      tenantId: employee.tenantId,
      userId: 'SYSTEM',
      userName: 'HR Engine',
      source: 'ORCHESTRATOR',
      entityType: 'payments',
      entityId: payslip.id,
      payload: {
        action: 'PAYROLL_PROCESSED',
        payslipId: payslip.id,
        employeeName: employee.name,
        grossTotal: payslip.grossTotal,
        netSalary: payslip.netSalary,
        irtDeduction: payslip.irtDeduction,
        ssEmployee: payslip.socialSecurityEmployee,
        ssCompany: payslip.socialSecurityCompany,
      },
      sideEffects: [
        `1. Recibo de Vencimento #${payslip.id} emitido para ${employee.name}`,
        `2. Lançamento Contabilístico: Débito 62.1 (Gastos com Pessoal) ${payslip.grossTotal.toLocaleString()}`,
        `3. Retenções na Fonte: Crédito 34.2 (IRT) ${payslip.irtDeduction.toLocaleString()} + Crédito 34.3 (INSS) ${payslip.socialSecurityEmployee.toLocaleString()}`,
        `4. Pagamento Líquido executado via ${paymentMethod}: ${payslip.netSalary.toLocaleString()}`,
      ],
    });

    return payslip;
  }
}
