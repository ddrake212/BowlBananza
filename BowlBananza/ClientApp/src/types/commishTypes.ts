export interface CommishData {
    Users: { UserName: string, UserId: number }[];
    CanSyncData: boolean;
    CurrentCommish: number;
    CanLockDown: boolean;
    CanLoadTieBreak: boolean;
    CanUnlock: boolean;
    CanForceUpdate: boolean;
}