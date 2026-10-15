1020c9890:	ff c3 00 d1	sub	sp, sp, #0x30
1020c9894:	f4 4f 01 a9	stp	x20, x19, [sp, #0x10]
1020c9898:	fd 7b 02 a9	stp	x29, x30, [sp, #0x20]
1020c989c:	fd 83 00 91	add	x29, sp, #0x20
1020c98a0:	28 10 02 d0	adrp	x8, 16902 ; 0x1062cf000
1020c98a4:	08 59 43 f9	ldr	x8, [x8, #0x6b0] ; Objc class ref: CNLoginSDKBaseRequest
1020c98a8:	e0 23 00 a9	stp	x0, x8, [sp]
1020c98ac:	a8 0b 02 90	adrp	x8, 16756 ; 0x10623d000
1020c98b0:	01 29 41 f9	ldr	x1, [x8, #0x250] ; Objc selector ref: init
1020c98b4:	e0 03 00 91	mov	x0, sp
1020c98b8:	e9 9f 8d 94	bl	0x10443185c ; Objc message: -[[x0 super] init]
1020c98bc:	f3 03 00 aa	mov	x19, x0
1020c98c0:	e0 03 00 b4	cbz	x0, 0x1020c993c
1020c98c4:	60 06 40 f9	ldr	x0, [x19, #0x8]
1020c98c8:	68 a8 01 f0	adrp	x8, 13583 ; 0x1055d8000
1020c98cc:	08 e1 23 91	add	x8, x8, #0x8f8 ; Objc cfstring ref: @""
1020c98d0:	68 06 00 f9	str	x8, [x19, #0x8]
1020c98d4:	f7 9f 8d 94	bl	0x1044318b0 ; symbol stub for: _objc_release
1020c98d8:	60 0a 40 f9	ldr	x0, [x19, #0x10]
1020c98dc:	08 a9 01 90	adrp	x8, 13600 ; 0x1055e9000
1020c98e0:	08 e1 13 91	add	x8, x8, #0x4f8 ; Objc cfstring ref: @"1.1"
1020c98e4:	68 0a 00 f9	str	x8, [x19, #0x10]
1020c98e8:	f2 9f 8d 94	bl	0x1044318b0 ; symbol stub for: _objc_release
1020c98ec:	48 0f 02 d0	adrp	x8, 16874 ; 0x1062b3000
1020c98f0:	00 a1 42 f9	ldr	x0, [x8, #0x540] ; Objc class ref: _OBJC_CLASS_$_NSMutableDictionary
1020c98f4:	80 9f 8d 94	bl	0x1044316f4 ; symbol stub for: _objc_alloc
1020c98f8:	72 c6 90 94	bl	0x1044fb2c0
1020c98fc:	68 1e 40 f9	ldr	x8, [x19, #0x38]
1020c9900:	60 1e 00 f9	str	x0, [x19, #0x38]
1020c9904:	e0 03 08 aa	mov	x0, x8
1020c9908:	ea 9f 8d 94	bl	0x1044318b0 ; symbol stub for: _objc_release
1020c990c:	88 a1 01 f0	adrp	x8, 13363 ; 0x1054fc000
1020c9910:	1f 20 03 d5	nop
1020c9914:	01 f9 43 f9	ldr	x1, [x8, #0x7f0]
1020c9918:	60 82 00 91	add	x0, x19, #0x20
1020c991c:	0f a0 8d 94	bl	0x104431958 ; symbol stub for: _objc_storeStrong
1020c9920:	c8 00 80 52	mov	w8, #0x6
1020c9924:	68 1e 00 b9	str	w8, [x19, #0x1c]
1020c9928:	48 00 80 52	mov	w8, #0x2
1020c992c:	60 16 40 f9	ldr	x0, [x19, #0x28]
1020c9930:	7f a2 02 a9	stp	xzr, x8, [x19, #0x28]
1020c9934:	df 9f 8d 94	bl	0x1044318b0 ; symbol stub for: _objc_release
1020c9938:	7f 62 00 39	strb	wzr, [x19, #0x18]
1020c993c:	e0 03 13 aa	mov	x0, x19
1020c9940:	fd 7b 42 a9	ldp	x29, x30, [sp, #0x20]
1020c9944:	f4 4f 41 a9	ldp	x20, x19, [sp, #0x10]
1020c9948:	ff c3 00 91	add	sp, sp, #0x30
1020c994c:	c0 03 5f d6	ret
