/* 用 iPhoneOS arm64 SDK 复核 guest z_stream 的每个跨边界字段。 */
#include <stddef.h>
#include <zlib.h>
_Static_assert(sizeof(z_stream) == 112, "z_stream size");
_Static_assert(offsetof(z_stream, next_in) == 0, "next_in");
_Static_assert(offsetof(z_stream, avail_in) == 8, "avail_in");
_Static_assert(offsetof(z_stream, total_in) == 16, "total_in");
_Static_assert(offsetof(z_stream, next_out) == 24, "next_out");
_Static_assert(offsetof(z_stream, avail_out) == 32, "avail_out");
_Static_assert(offsetof(z_stream, total_out) == 40, "total_out");
_Static_assert(offsetof(z_stream, msg) == 48, "msg");
_Static_assert(offsetof(z_stream, state) == 56, "state");
_Static_assert(offsetof(z_stream, zalloc) == 64, "zalloc");
_Static_assert(offsetof(z_stream, zfree) == 72, "zfree");
_Static_assert(offsetof(z_stream, opaque) == 80, "opaque");
_Static_assert(offsetof(z_stream, data_type) == 88, "data_type");
_Static_assert(offsetof(z_stream, adler) == 96, "adler");
_Static_assert(offsetof(z_stream, reserved) == 104, "reserved");
