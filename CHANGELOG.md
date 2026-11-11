# Changelog

## 1.0.0 (2026-10-22)


### Features

* a reloaded camera re-enters its room by itself ([09f464a](https://github.com/AndreaMinato/dog-watch/commit/09f464a1b2fa2e181398b840f2b56238cce545e7))
* add the 'Come funziona e cosa salviamo' page linked from Home ([37d41b8](https://github.com/AndreaMinato/dog-watch/commit/37d41b8de0bb93acc8ca742513d1895e47eddf2e))
* ask for the new key when a remembered key was rotated ([be29bb9](https://github.com/AndreaMinato/dog-watch/commit/be29bb9e3cfc515e9a829c52c7641d174c645abe))
* ask to retry later after too many wrong keys ([af89ee9](https://github.com/AndreaMinato/dog-watch/commit/af89ee9bba70f16325b785ab0b2c4b094428428a))
* create a room and join it with its key ([771ea4f](https://github.com/AndreaMinato/dog-watch/commit/771ea4fb8b4555fe79d5cc1bf741bdc03918fa2b))
* create a room and join it with its key ([e1d1b52](https://github.com/AndreaMinato/dog-watch/commit/e1d1b52b140f7c392dbb099fd44d20039e23cd89)), closes [#4](https://github.com/AndreaMinato/dog-watch/issues/4)
* detect unsupported browsers and camera-incapable devices ([fc3d037](https://github.com/AndreaMinato/dog-watch/commit/fc3d03745875e690248bff81b220f91f4758d532))
* expire anonymous sessions after ten minutes ([2026d13](https://github.com/AndreaMinato/dog-watch/commit/2026d139740f40c97bf842c8b59e93efdf2b5c37))
* fall back to STUN only when no TURN key is configured ([1572fd0](https://github.com/AndreaMinato/dog-watch/commit/1572fd0d653e05904e9cf5589c9922610a1e13bd))
* forget a remembered room ([fa3d680](https://github.com/AndreaMinato/dog-watch/commit/fa3d6805f066237a3f7e622f8e5c03d6425230f9))
* issue Cloudflare TURN credentials to room members ([6ce79a3](https://github.com/AndreaMinato/dog-watch/commit/6ce79a386e900575e70298f06aa6e987c4cd2d2c))
* keep the camera screen on with a wake lock ([86ecc9b](https://github.com/AndreaMinato/dog-watch/commit/86ecc9b475ef87c89e0e0a26eb3f67853a8c3708))
* let a camera rotate the key or close the room ([c386c37](https://github.com/AndreaMinato/dog-watch/commit/c386c375138740aa2406fe3c303a42626fd0a574))
* let a camera with several lenses choose which one films ([57d3dba](https://github.com/AndreaMinato/dog-watch/commit/57d3dba96f26626c323ae12d95f342f5de6581f7))
* let the camera refuse a fourth viewer link ([5bb3089](https://github.com/AndreaMinato/dog-watch/commit/5bb30890689e48d48b75ac2dbff3ed129aac42e0))
* limit failed join attempts per IP and purge expired rooms ([78638cb](https://github.com/AndreaMinato/dog-watch/commit/78638cb102960bbd73a63c111fb8a878242489ae))
* links to a camera recover after a network loss ([8c81f1b](https://github.com/AndreaMinato/dog-watch/commit/8c81f1b3f80e2225013acfdc2f0e16dc993a789f))
* list recent rooms on the home and re-enter them with a tap ([fd263a9](https://github.com/AndreaMinato/dog-watch/commit/fd263a9349ae079a3f9c6001b371d99ea7ce8dfb))
* list the connected viewers on the camera ([21a55f8](https://github.com/AndreaMinato/dog-watch/commit/21a55f8cebe30ca8e8673b2cb9afe31e94cb6200))
* MVP 1.0 — Stanze con Chiave, Camera e Spettatore ([ef58ca9](https://github.com/AndreaMinato/dog-watch/commit/ef58ca9980d757aafbc3b89c5ad51286c0f18096))
* order members by the server join instant and refuse the latest even after entering ([22b8fcd](https://github.com/AndreaMinato/dog-watch/commit/22b8fcdaa84d6d7b4888706f974be146cb334bb8))
* reacquire the camera when the page becomes visible again ([d468ffb](https://github.com/AndreaMinato/dog-watch/commit/d468ffb9788b6924438a73b5218182d87eccdaa7))
* refuse a fifth camera, a fourth viewer and duplicate camera names ([836d91a](https://github.com/AndreaMinato/dog-watch/commit/836d91a157a07746f30882eed5c58dabc1b4121e))
* remind the camera to stay charging and in the foreground ([e3d4a04](https://github.com/AndreaMinato/dog-watch/commit/e3d4a04166b7273cc252bc760a768d029cc00378))
* renew ICE credentials before they expire ([57b176e](https://github.com/AndreaMinato/dog-watch/commit/57b176ef376ff7083d88a1e89c8df4deabbfab98))
* rest the camera on a black screen that wakes up on a tap ([14756ce](https://github.com/AndreaMinato/dog-watch/commit/14756cea9e8dff119fd1516f99470ff3649e3b54))
* return the room name when joining a room ([62920e7](https://github.com/AndreaMinato/dog-watch/commit/62920e7e43c8947139bb8b6c8cbfe45d99755a3e))
* rotate the key or close the room from a camera ([d0b49af](https://github.com/AndreaMinato/dog-watch/commit/d0b49af60e281a47ff593f220b44e602569e6638))
* scaffold Vue SPA, lint hook, local Supabase and CI ([#18](https://github.com/AndreaMinato/dog-watch/issues/18)) ([2bab266](https://github.com/AndreaMinato/dog-watch/commit/2bab2663ab0e03f51976150b926e6b903c87e747))
* show a join link and QR on the camera on request ([2a7cb8a](https://github.com/AndreaMinato/dog-watch/commit/2a7cb8a0f839397460e28e13a1d63582b7021a36)), closes [#13](https://github.com/AndreaMinato/dog-watch/issues/13)
* show cameras in a grid and enlarge one with a tap ([bb88a46](https://github.com/AndreaMinato/dog-watch/commit/bb88a46f3d2f366e3cfa40ec0a8cce7cdd634ec2))
* stream the camera live to a viewer over WebRTC ([e8a62e7](https://github.com/AndreaMinato/dog-watch/commit/e8a62e7fee784547da8445455ae6a6795c4dc1d5))
* tell viewers when another viewer joins ([4a1540c](https://github.com/AndreaMinato/dog-watch/commit/4a1540c1565ce553f851afaef86fd36dce5faa96))
* the camera pauses its video and the viewer sees it paused ([4ab1e10](https://github.com/AndreaMinato/dog-watch/commit/4ab1e10af7911dd93817c4ac4fba6772a81405a0))
* the viewer shows since when a camera is offline ([6d2d4d9](https://github.com/AndreaMinato/dog-watch/commit/6d2d4d9216501045e66aba766376e46d860e464e))


### Bug Fixes

* a camera keeps retrying to re-enter its room until it gets a definitive answer ([366e135](https://github.com/AndreaMinato/dog-watch/commit/366e135414661644d9e83f2dbbed9bd90cb9f579))
* a camera that leaves on purpose disappears from the viewers' grid ([8fe8048](https://github.com/AndreaMinato/dog-watch/commit/8fe80480242956c09726358e3f009a5c6a5c9fbc))
* answer every invalid key after the same uniform delay ([0797ca7](https://github.com/AndreaMinato/dog-watch/commit/0797ca771559cd06840a53ede0475246eedcf15c))
* deploy and keepalive reach the database through the IPv4 pooler ([#22](https://github.com/AndreaMinato/dog-watch/issues/22)) ([ff58864](https://github.com/AndreaMinato/dog-watch/commit/ff5886497b36645d25342599dce931384c9fd2a2))
* simulate Cloudflare locally through the TURN key id ([90339ab](https://github.com/AndreaMinato/dog-watch/commit/90339ab15f7f679211fc76d08820fac4a3a6bed5))
* stop tracks captured after the camera session closed ([f3e8f4e](https://github.com/AndreaMinato/dog-watch/commit/f3e8f4ed1fd0a2a8b523e2608a883e3ab4b1974d))
* wizard handles a project with no Edge Function secrets on bash 3.2 ([b455089](https://github.com/AndreaMinato/dog-watch/commit/b4550899a5f37782c4c71d7ef4a62a529b9556e7))
