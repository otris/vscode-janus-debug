'use strict';

/**
 * A hashed string.
 *
 * The value property always looks like follows.
 *
 *     $id$salt$encrypted
 *
 * Whereas id is always 1, salt is the salt used during encryption and can be empty, and encrypted is the actual
 * computed secret.
 */
export class Hash {
    constructor(public value: string) { }
}

/**
 * Mimics POSIX crypt(3) with MD5 instead of DES.
 * @param {string} key A user's typed secret.
 * @param {string} salt The salt used to perturb the algorithm. Can be empty.
 */
export function crypt_md5(key: string, salt: string): Hash {
    const result: string = '';
    return new Hash(result);
}
