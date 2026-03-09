import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function excelDateToJSDate(serial: number) {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + serial * 86400000);
  }

async function main() {
  const workbook = XLSX.readFile("data/agility_employee.xlsx");

  // ===== TEAM SHEET =====
  const teamSheet = workbook.Sheets["team"];
  const teamRows: any[] = XLSX.utils.sheet_to_json(teamSheet);

  for (const row of teamRows) {
    await prisma.team.upsert({
      where: { code: row.code },
      update: {
        name: row.name?.trim(),
        description: row.description,
      },
      create: {
        code: row.code?.trim(),
        name: row.name?.trim(),
        description: row.description,
      },
    });
  }

  console.log("Teams imported");

  // ===== EMPLOYEE SHEET =====
  const employeeSheet = workbook.Sheets["employee"]; 
  const employeeRows: any[] = XLSX.utils.sheet_to_json(employeeSheet);

  for (const row of employeeRows) {
    const rawEmail = typeof row.email === "string" ? row.email : "";

    const email =
      rawEmail.trim().toLowerCase() ||
      `unknown-${Date.now()}-${Math.random()}@local`;

    if (!email) {
      console.log("Missing email row:", row);
      return;
    }
   
    const team = await prisma.team.findUnique({
        where: { code: row.team_code?.trim() },
    });

    await prisma.employee.upsert({
      where: { email },
      update: {
        name: row.name?.trim(),
        date_of_birth: excelDateToJSDate(row.date_of_birth),
        work_location: row.work_location,
        phone: String(row.phone),
        status: row.status,
        job_title: row.job_title || null,
        teamId: team?.id,
      },
      create: {
        email: email,
        name: row.name?.trim(),
        date_of_birth: excelDateToJSDate(row.date_of_birth),
        work_location: row.work_location,
        phone: String(row.phone),
        status: row.status,
        job_title: row.job_title || null,
        teamId: team?.id,
      },
    });
  }

  console.log("Employees imported");
}

main();