import { GameInfo, TeamInfo } from "./gameTypes";

export interface HomeData {
    Games: GameInfo[];
    Users: {
        Id: number;
        FirstName: string;
        LastName: string;
        Username: string;
        Password: string;
        Email: string;
        isCom: boolean | null;
        Inactive: boolean | undefined;
    }[];
    UserSelections: {
        Id: number;
        Year: number;
        User: number;
        GameId: number;
        TeamId: number;
    }[];
    Teams: TeamInfo[];
    UserProperties?: {
        Id: number;
        UserId: number;
        Color?: string;
        Image?: string;
    }[];
    IsLocked: boolean;
    UserId: number;
}