/// <reference path="references/tsd.d.ts" />

/**
 * An interface for a simple logger. 
 */
export interface Logger {

    /**
     * Log a messagewith a specified type
     * @param {string} type    The type of message
     * @param {string} message The message to log
     */
    log(type : string, message : string) : void;

    /**
     * Log a message as the info type
     * @param {string} message The message to log
     */
    log(message : string) : void;

    /**
     * Log a message as the info type
     * @param {string} message The message to log
     */
    info(message : string) : void;

    /**
     * Log a message as the warning type
     * @param {string} message The message to log
     */
    warn(message : string) : void;

    /**
     * Log a message as the error type
     * @param {string} message The message to log
     */
    error(message : string) : void;
}

/**
 * A class that implements the logger interface, but does nothing
 */
export class FakeLogger implements Logger {

    log(type : string, message ?: string) : void {}

    info(message : string) : void {}
    warn(message : string) : void {}
    error(message : string) : void {}
}