import e from "express";

export enum DomainErrorCode{
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    UNAUTHORIZED = 'UNATHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export abstract class DomainException extends Error {
    public readonly code: DomainErrorCode;

    protected constructor(message: string, code: DomainErrorCode){
        super(message);
        this.name = this.constructor.name;
        this.code = code;
    }
}

export class ValidationDomainException extends DomainException {
    constructor(message: string){
        super(message, DomainErrorCode.VALIDATION_ERROR);
    }
}

export class NotFoundDomainException extends DomainException    {
    constructor(message: string){
        super(message, DomainErrorCode.NOT_FOUND);
    }
}

export class ConflictDomainException extends DomainException {
    constructor(message: string){
        super(message, DomainErrorCode.CONFLICT);
    }
}

export class UnauthorizedDomainException extends DomainException {
    constructor(message: string){
        super(message, DomainErrorCode.UNAUTHORIZED);
    }
}

export class ForbiddenDomainException extends DomainException {
    constructor(message: string){
        super(message, DomainErrorCode.FORBIDDEN);
    }
}

export class ExternalServiceDomainException extends DomainException {
    constructor(message: string){
        super(message, DomainErrorCode.SERVICE_UNAVAILABLE);
    }
}