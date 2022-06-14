import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import * as dbUtil from './../utils/dbUtil';

interface Report {
    year: number,
    caregivers: {
        name: string,
        patients: string[]
    }[]
}

export const getReport = async (req: Request, res: Response) => {

    const sql = `
        SELECT
            caregiver.id      AS caregiver_id,
            caregiver.name    AS caregiver_name,
            patient.id        AS patient_id,
            patient.name      AS patient_name,
            visit.date        AS visit_date
        FROM caregiver
        JOIN visit ON visit.caregiver = caregiver.id
        JOIN patient ON patient.id = visit.patient
    `;
    
    let result : QueryResult;
    try {
        result = await dbUtil.sqlToDB(sql, []);
        const report: Report = {
            year: parseInt(req.params.year),
            caregivers: []
        };

        let caregiverPatientsMap = new Map<string, string[]>();

        for ( let row of result.rows) {
            if (!caregiverPatientsMap.has(row.caregiver_name)) {
                caregiverPatientsMap.set(row.caregiver_name, [row.patient_name]);
            } else {
                caregiverPatientsMap.get(row.caregiver_name)?.push(row.patient_name);
            } 
        }

        caregiverPatientsMap.forEach((value: string[], key: string) => {
            report.caregivers.push({name: key, patients: value});
        });

        res.status(200).json(report);
    } catch (error) {
        throw new Error(error.message);
    }

}
