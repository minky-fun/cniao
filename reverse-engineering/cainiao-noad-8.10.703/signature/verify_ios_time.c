/* Compile-only checks for the Darwin arm64 time ABI used by guest_clock.py. */
#include <stddef.h>
#include <sys/time.h>
#include <time.h>

_Static_assert(sizeof(time_t) == 8, "time_t must be 64-bit");
_Static_assert(sizeof(struct timeval) == 16, "timeval must occupy 16 bytes");
_Static_assert(offsetof(struct timeval, tv_sec) == 0, "tv_sec offset mismatch");
_Static_assert(offsetof(struct timeval, tv_usec) == 8, "tv_usec offset mismatch");
_Static_assert(sizeof(((struct timeval *)0)->tv_usec) == 4, "tv_usec must be 32-bit");
_Static_assert(sizeof(struct timezone) == 8, "timezone must occupy 8 bytes");
