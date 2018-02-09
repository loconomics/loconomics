/**
 * Available types of users and special union values that match several types.
 * IMPORTANT: it matches same values on the server, any change should go in
 * sync
 * @enum {number}
  */
export default {
    none: 0,
    anonymous: 1,
    client: 2,
    serviceProfessional: 4,
    // All Members (member-only:8) are service professionals too: 4+8
    member: 12,
    admin: 16,
    // All users except anonymous and system:
    loggedUser: 30,
    // All users except system,
    user: 31,
    system: 32
};
