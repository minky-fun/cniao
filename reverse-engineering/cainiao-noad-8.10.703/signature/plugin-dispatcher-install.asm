
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102b2c484 <_CMi03Zt2QbtMER>:
102b6d0b0: d100c3ff    	sub	sp, sp, #0x30
102b6d0b4: a9016ffc    	stp	x28, x27, [sp, #0x10]
102b6d0b8: a90267fa    	stp	x26, x25, [sp, #0x20]
102b6d0bc: aa0203e0    	mov	x0, x2
102b6d0c0: 528009e8    	mov	w8, #0x4f               ; =79
102b6d0c4: b90007e8    	str	w8, [sp, #0x4]
102b6d0c8: 910023e8    	add	x8, sp, #0x8
102b6d0cc: 910013e9    	add	x9, sp, #0x4
102b6d0d0: 10000027    	adr	x7, 0x102b6d0d4 <_CMi03Zt2QbtMER+0x40c50>
102b6d0d4: 9800015a    	ldrsw	x26, 0x102b6d0fc <_CMi03Zt2QbtMER+0x40c78>
102b6d0d8: aa3a03fa    	mvn	x26, x26
102b6d0dc: aa3a03fa    	mvn	x26, x26
102b6d0e0: 9102bb5a    	add	x26, x26, #0xae
102b6d0e4: b9800125    	ldrsw	x5, [x9]
102b6d0e8: 8b05035a    	add	x26, x26, x5
102b6d0ec: 8b1a00e7    	add	x7, x7, x26
102b6d0f0: 528000f0    	mov	w16, #0x7               ; =7
102b6d0f4: b9000110    	str	w16, [x8]
102b6d0f8: d61f00e0    	br	x7
102b6d0fc: ffffff3b    	<unknown>
102b6d100: ba73439a    	<unknown>
102b6d104: 219d051f    	<unknown>
102b6d108: c1560291    	fmls	za.s[w8, 1, vgx2], { z20.s, z21.s }, z6.s[0]
102b6d10c: 528014a8    	mov	w8, #0xa5               ; =165
102b6d110: b9000fe8    	str	w8, [sp, #0xc]
102b6d114: 910033e8    	add	x8, sp, #0xc
102b6d118: 10000025    	adr	x5, 0x102b6d11c <_CMi03Zt2QbtMER+0x40c98>
102b6d11c: 980000cd    	ldrsw	x13, 0x102b6d134 <_CMi03Zt2QbtMER+0x40cb0>
102b6d120: b980011b    	ldrsw	x27, [x8]
102b6d124: cb1b01ad    	sub	x13, x13, x27
102b6d128: 8b0d00a5    	add	x5, x5, x13
102b6d12c: d28013e8    	mov	x8, #0x9f               ; =159
102b6d130: d61f00a0    	br	x5
102b6d134: 000000d1    	udf	#0xd1
102b6d138: 2be47d30    	<unknown>
102b6d13c: 78a0fc92    	<unknown>
102b6d140: 079a712b    	<unknown>
102b6d144: 028972d1    	<unknown>
102b6d148: d001ec68    	adrp	x8, 0x1068fb000 <dyld_stub_binder+0x1068fb000>
102b6d14c: f9072902    	str	x2, [x8, #0xe50]
102b6d150: a94267fa    	ldp	x26, x25, [sp, #0x20]
102b6d154: a9416ffc    	ldp	x28, x27, [sp, #0x10]
102b6d158: 9100c3ff    	add	sp, sp, #0x30
102b6d15c: d65f03c0    	ret
102b6d160: d100c3ff    	sub	sp, sp, #0x30
102b6d164: a9015ff8    	stp	x24, x23, [sp, #0x10]
102b6d168: a90257f6    	stp	x22, x21, [sp, #0x20]
102b6d16c: 52800f28    	mov	w8, #0x79               ; =121
102b6d170: b9000be8    	str	w8, [sp, #0x8]
102b6d174: 910033e8    	add	x8, sp, #0xc
102b6d178: 910023e9    	add	x9, sp, #0x8
102b6d17c: 10000030    	adr	x16, 0x102b6d180 <_CMi03Zt2QbtMER+0x40cfc>
102b6d180: 980000f6    	ldrsw	x22, 0x102b6d19c <_CMi03Zt2QbtMER+0x40d18>
102b6d184: b9800137    	ldrsw	x23, [x9]
102b6d188: cb1702d6    	sub	x22, x22, x23
102b6d18c: 8b160210    	add	x16, x16, x22
102b6d190: 52800415    	mov	w21, #0x20              ; =32
102b6d194: b9000115    	str	w21, [x8]
102b6d198: d61f0200    	br	x16
102b6d19c: 000000ad    	udf	#0xad
102b6d1a0: 14180b82    	b	0x10316ffa8 <_SGiZvnmT95T+0x58b89c>
102b6d1a4: 21a67423    	<unknown>
102b6d1a8: 31d7219a    	<unknown>
102b6d1ac: 12363961    	and	w1, w11, #0x1fffc00
102b6d1b0: 48b20d36    	<unknown>
102b6d1b4: 10e74ba0    	adr	x0, 0x102b3bb28 <_CMi03Zt2QbtMER+0xf6a4>
102b6d1b8: d503201f    	nop
102b6d1bc: a94257f6    	ldp	x22, x21, [sp, #0x20]
102b6d1c0: a9415ff8    	ldp	x24, x23, [sp, #0x10]
102b6d1c4: 9100c3ff    	add	sp, sp, #0x30
102b6d1c8: d65f03c0    	ret
