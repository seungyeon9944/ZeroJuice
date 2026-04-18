export interface ParkingSettings {
    id: number;
    feeBase: number;
    timeBase: number;
    feeUnit: number;
    timeUnit: number;
    freeTime: number;
    cctvUrl?: string;
}
