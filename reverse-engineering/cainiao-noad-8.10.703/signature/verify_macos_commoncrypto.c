/* Compile against the actual macOS SDK before using the offline ctypes oracle. */
#include <CommonCrypto/CommonCryptor.h>
#include <stddef.h>

_Static_assert(kCCEncrypt == 0 && kCCDecrypt == 1, "CCOperation values");
_Static_assert(kCCAlgorithmAES128 == 0, "AES algorithm identifier");
_Static_assert(kCCOptionPKCS7Padding == 1 && kCCOptionECBMode == 2, "CCOptions flags");
_Static_assert(sizeof(CCOperation) == 4 && sizeof(CCAlgorithm) == 4, "CC enum widths");
_Static_assert(sizeof(CCOptions) == 4 && sizeof(CCCryptorStatus) == 4, "CC flags/status widths");
_Static_assert(sizeof(size_t) == 8 && sizeof(void *) == 8, "macOS LP64 ABI");

/* Assignment type-checks the exact pointer and length argument order. */
static CCCryptorStatus (*const checked_signature)(CCOperation, CCAlgorithm, CCOptions,
    const void *, size_t, const void *, const void *, size_t, void *, size_t, size_t *) = CCCrypt;

/* Keep the type-checked symbol available without performing any cryptographic operation. */
const void *verified_commoncrypto_signature(void) { return (const void *)checked_signature; }
