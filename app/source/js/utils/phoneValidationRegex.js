/**
 * Offers several Regular Expressions to validate phone numbers.
 * Only supports North America patterns and a general rule of valid chars for
 * anything else.
 */
'use strict';

/**
 * Matches anything with almost a digit, parenthesis, dash, dot or
 * whitespace
 */
exports.GENERAL_VALID_CHARS = /[\d\(\)\-\.\ ]+/;
/**
 * Matches numbers between 10 to 14 digits using several grouping patterns:
 * - (123) 456-7890  Prefix between parenthesis and dash separator
 * - 123-456-7890    Dash as unique separator
 * - 123.456.7890    Dot as unique separator
 * - 1234567890      Just digits
 */
exports.NORTH_AMERICA_PATTERN = /^\([1-9]\d{2}\)\ \d{3}\-\d{4,8}$|^[1-9]\d{2}\-\d{3}\-\d{4,8}$|^[1-9]\d{2}\.\d{3}\.\d{4,8}$|^[1-9]\d{9,13}$/;
