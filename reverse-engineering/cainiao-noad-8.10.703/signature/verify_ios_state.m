/* Verify the public iPhoneOS directory, access and errno constants used by the offline slice. */
#import <Foundation/Foundation.h>
#include <sys/syscall.h>
#include <unistd.h>
#include <errno.h>

_Static_assert(sizeof(void *) == 8, "arm64 pointer width");
_Static_assert(NSDocumentDirectory == 9, "Documents directory selector");
_Static_assert(NSUserDomainMask == 1, "user domain");
_Static_assert(SYS_access == 33, "Darwin access syscall");
_Static_assert(F_OK == 0, "existence check mode");
_Static_assert(ENOENT == 2, "missing entry errno");
