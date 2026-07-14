export const APPLICATION_STATUSES = ["draft", "submitted", "under_review", "needs_changes", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface DriverApplication {
  applicantUid: string; applicationId: string; accountType: "driver"; legalName: string; email: string; phoneNumber: string;
  dateOfBirth: string; address: string; city: string; state: string; pincode: string; licenceNumber: string; licenceExpiry: string;
  drivingExperienceYears: number; preferredServiceArea: string; emergencyContact: { name: string; phone: string };
  languages: string[]; availability: string; vehicleOwnershipType: "own_vehicle" | "company_fleet" | "no_vehicle";
  declarationsAccepted: boolean; consentAccepted: boolean; status: ApplicationStatus; reviewNotes: string; rejectionReason: string;
  changeRequests: string[]; schemaVersion: number;
}

export interface VehicleOwnerApplication {
  applicationId: string; ownerUid: string; ownerName: string; ownerEmail: string; ownerPhone: string;
  ownerType: "individual" | "fleet_company"; businessName: string; gstNumber: string; address: string; city: string; state: string;
  pincode: string; preferredOperatingArea: string; registrationNumber: string; vehicleMake: string; vehicleModel: string;
  manufacturingYear: number; vehicleType: string; seats: number; fuelType: string; serviceCategory: string; permitStatus: string;
  permitExpiry: string; insuranceExpiry: string; fitnessExpiry: string; pollutionExpiry: string; commercialRegistrationConfirmed: boolean;
  driverAttached: boolean; attachedDriver: { name: string; phone: string }; acAvailable: boolean; luggageCapacity: string;
  vehicleColor: string; notes: string; status: ApplicationStatus; reviewNotes: string; rejectionReason: string;
  changeRequests: string[]; schemaVersion: number;
}
