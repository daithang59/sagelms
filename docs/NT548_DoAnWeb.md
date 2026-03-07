

## BÁOCÁOKẾHOẠCHĐỒÁN
HệthốngWebMicroservices:
SageLMS:NềntảngWebLMStíchhợpAITutor(RAG)
## Ngàylập07/03/2026
PhạmviMVP(cóCItốithiểukhimởPR;chưa
triểnkhaipipelineCI/CDhoàn
chỉnh)
MôitrườngmụctiêuLocal(Docker)vàStaging/Demo
(Kubernetes/AWSEKS–triểnkhai
thủcông)
1.Tómtắtđiềuhành
Đồánxâydựngnềntảnghọctập(LMS)theokiếntrúcmicroservicesvà
tíchhợpAITutortheomôhìnhRAG(Retrieval-AugmentedGeneration)
đểhỏiđápdựatrêntàiliệu/nộidungnộibộcủakhoáhọc.MVPtậptrung
hoànthiệncácluồngnghiệpvụcốtlõi,cóthểchạyend-to-end,cótàiliệu
vàhướngdẫnđủđểbắtđầupháttriểnvàtriểnkhai.
2.Bốicảnhvàbàitoán
Nhucầuquảnlýkhoáhọc,nộidungbàihọcvàtheodõitiếnđộhọctập
theotừnghọcviên.
## 
## Nhucầutạobàikiểmtra/quizcơbảnvàchấmđiểmtựđộng.
## 
NhucầuAITutorgiúphọcviênhỏiđápdựatrêntàiliệucủakhoáhọc
## (khôngtrảlờimơhồ/khôngdựanguồn).

3.Mụctiêu,phạmvivàkếtquảmongđợi
3.1Mụctiêu(Must-have)
## 
Auth&RBAC:đăngký/đăngnhập,JWT,phânquyềntheovaitrò
(admin/instructor/student)quaGateway/BFF.
## 
LMSCore:CourseCRUD,Enroll,Content(lesson/materialmetadata),
## Progresstracking(%hoànthành).
## 
Assessment:quiz/questionCRUDtốithiểu,attempt,chấmđiểmcơbản,
trảkếtquả.
AITutor(RAG):ingestion(chunking+embedding),lưuvectorbằng
PostgreSQL+pgvector,retrievalvàtrảlờiquaAPI.
## 
Asyncjobs:Redisqueue+worker;cójob-idvàAPItheodõitrạngthái
## (queued/running/succeeded/failed).
## 
Observabilitytốithiểu:correlation-id/trace-idxuyênGateway→
services;structuredloggingphụcvụdebugend-to-end.
3.2Ngoàiphạmvi(Outofscope)
PipelineCI/CDhoànchỉnh(tựđộngbuild/push/deploy,GitOps/ArgoCD,
DevSecOpsscanningtoàndiện).(CImứcPullRequestvẫncó:
build/test/lint/scancơbản).
Thanhtoán/subscription,multi-tenantnângcao.
## 
Analyticsnângcao,recommendationnângcao,A/Btesting.
## 
Bảomậtnângcao(WAF,secretsrotationphứctạp)–MVPchỉcấuhình
mứctốithiểuchodemo.
3.3Deliverables(sảnphẩmbàngiaoMVP)
1.SourcecodeđầyđủcủaGateway/BFFvàcácmicroservices.
2.OpenAPI/SwaggerchotừngservicevàGateway.
3.Databasemigrations+seeddữliệumẫu.

4.Hướngdẫnchạylocal(README)vàhướngdẫndeploythủcônglên
Kubernetes/EKS(manifest/Helmtốithiểu).
5.Demoscript(kịchbảndemo)+dữliệudemo.
6.Tàiliệukiếntrúc&vậnhànhtốithiểu(logging/tracing,cấuhìnhmôi
trường).
4.Yêucầuhệthống
4.1Yêucầuchứcnăng(FunctionalRequirements)
## Cácyêucầuchứcnăngchínhđượcnhómtheomodule:
Auth:quảnlýuser,đăngnhập,cấpJWT/refreshtoken(tuỳchọn),RBAC
policy.
Course:tạo/sửa/xoákhoáhọc;xemdanhsách;publish/unpublish(tuỳ
chọn).
Enroll:họcviênđăngkýkhoáhọc;instructorxemdanhsáchhọcviên.
## 
## Content:tạolesson/materialmetadata;gắnvàocourse;(tuỳchọn)
uploadfilequaobjectstorage/endpoint.
## 
## Progress:đánhdấuhoànthànhlesson;truyvấntiếnđộtheocourse/học
viên.
## 
## Assessment:tạoquiz;tạocâuhỏi;họcviênlàmbài;hệthốngchấmđiểm
vàlưukếtquả.
## 
AITutor:ingestnộidung;hỏiđáptheocourse;trảlờikèmthamchiếu
nguồn(lesson/chunk).
## 
## Async:triggerjob(vídụgeneratequiz);theodõitrạngtháijob;xemkết
quả/lỗi.

4.2Yêucầuphichứcnăng(Non-functionalRequirements)
Tínhsẵnsàngchodemo:chạyổnđịnhlocal;cóthểdeploystagingthủ
công.
## 
HiệunăngMVP:phảnhồiAPIthường<1s(khôngtínhthờigiangọiLLM);
endpointAIchấpnhậnlatencycaohơn.
## 
Bảomậttốithiểu:JWTvalidation,CORShợplý,secretsquaenv/secret
store(khônghardcode).
## 
## Quansáttốithiểu:logcócorrelation-id,errorformatthốngnhất,có
healthchecks.
Khảnăngmởrộng:servicestáchbiệt,cóthểscaleđộclập(đặcbiệtai-
tutor/worker).
5.Techstackđềxuất(MVP)
5.1Backend&API
Gateway/BFF:SpringCloudGateway(hoặcAPIGatewaytươngđương).
## 
Coreservices:SpringBoot(auth/course/content/progress/assessment).
AITutor+worker:PythonFastAPI(LangChainhoặcLLMclienttương
đương).
APIstyle:REST+OpenAPIcontract-first;errorformatthốngnhất.
5.2Data&Messaging
Database:PostgreSQL;tổchứctheoschemaperservice;migrations
(FlywaychoJava;Alembic/migrationtươngđươngchoPython).
Vectorstore:pgvectorextensiontrongPostgreSQL.
## 
Cache/Queue:Redis(queuechojobasync;cachetuỳchọnở
Gateway/BFF).

5.3Container&Deploy
Local:Docker+docker-compose(Postgres+Redis+services).
Staging/Demo:Kubernetes(ưutiênEKS)+manifests/Helmtốithiểu.
IaC:Terraform(provisionEKS/VPC/RDS/Redistuỳmứctriểnkhai).
Lưuý:khôngthiếtlậpCI/CD;build&deploythựchiệnthủcôngtheo
hướngdẫn.
5.4Phiênbản&chuẩnhoácôngcụ
## 
ChuẩnhoáAPI:OpenAPI3.0,versioning/api/v1,errorformatthống
nhất.
## 
Chuẩnhoácodequality:Java(Spotless+Checkstyle),Python(ruff+
black).
JDK:17LTS;SpringBoot:3.x;Python:3.11;FastAPI:ổnđịnh;PostgreSQL:
15/16;Redis:7.x.
5.5Frontend&UI
Framework&Build
## 
React18+TypeScript
## 
## Vite(devservernhanh,cấuhìnhnhẹ)
UI&Styling
TailwindCSS+shadcn/ui(RadixUI)–nhanhdựngUI,dễtuỳbiến
Routing,DataFetching,State
## 
Routing:ReactRouterv6+
## 
Server-state:TanStackQuery(ReactQuery)–cache/retry/loadingstates
chuẩn
## 
Client/UIstate(tuỳchọn):Zustand(nhẹ)hoặcReactContextnếuítstate
Forms,Validation,Auth
Forms:ReactHookForm
Validation:Zod(+resolverchoReactHookForm)
HTTPclient:Axios(hoặcfetchwrapper).InterceptorgắnAuthorization
## Bearertoken.

## 
APIcontracts:KhuyếnnghịsinhtypedclienttừOpenAPI(openapi-
generator)đểtránhlệchrequest/response.
Testing&Quality(đểgắnvàoCImứcPR)
Unit/UItests:Vitest+ReactTestingLibrary
E2E(tuỳchọn):Playwright(phùhợpdemoend-to-end)
Lint/format:ESLint+Prettier;pre-commit(tuỳchọn):Husky+lint-
staged
6.Kiếntrúchệthống
6.1Danhsáchmicroservicesvàtráchnhiệm
ServiceTráchnhiệmchính
auth-serviceUser/Role,JWT,RBACpolicy,tokenverification.
course-serviceCourseCRUD,enrollments,publishstate.
content-serviceLesson/materialmetadata,liênkếtcourse,cung
cấpdữliệuchoingestion.
progress-serviceTrackinghoànthànhlesson,tínhtiếnđộ,progress
query.
assessment-serviceQuiz/question/attempt/grading,lưuđiểmvàbáo
cáotốithiểu.
ai-tutor-serviceIngestion+vectorsearch+answer;cungcấpAPI
hỏiđáp;điềuphốijobAI.
worker(cóthểtách)ConsumeRedisqueue,chạytácvụnặng(generate
quiz/ingestbatch).
6.2Luồngrequesttổngquan
1.ClientgọiAPIquaGateway/BFF.

2.GatewayxácthựcJWT,ápRBAC,gắncorrelation-id/trace-id,địnhtuyến
requestđếnserviceđích.
3.Servicexửlýnghiệpvụvàthaotácdữliệutrongschemacủamình;
khôngjoindữliệucross-serviceởruntime.
4.Tácvụnặng/asynchronous:servicepublishmessagevàoRedisqueue;
workerconsumevàcậpnhậtjobstatustrongDB.
5.AITutorRAG:lấynguồnnộidung→chunking→embedding→lưu
pgvector→retrieval→gọiLLM→trảlờikèmcitation.
6.3ChuẩnAPIvàerrorformat
## Khuyếnnghịchuẩnresponselỗithốngnhất(vídụ):
{"timestamp":"...","path":"/api/...","errorCode":"COURSE_NOT_FOUND",
"message":"...","correlationId":"..."}
7.Thiếtkếdữliệu(MVP)
7.1Nguyêntắcdữliệu
## 
SchemaperservicetrongmộtPostgresinstance(MVP).
## 
## Migrationsbắtbuộcchomọithayđổischema.
Quanhệcross-servicethểhiệnbằngIDthamchiếu(UUID/string),không
jointrựctiếpởruntime.
7.2Bảngdữliệucốtlõi(đềxuất)
## Tốithiểunêncócácbảng(gợiý):
## auth.users(id,email,password_hash,role,created_at,...)
## 
course.courses(id,title,description,status,instructor_id,...)
## 
course.enrollments(id,course_id,student_id,enrolled_at,...)

## 
content.lessons(id,course_id,title,content_type,content_ref,
order_index,...)
## progress.lesson_progress(id,lesson_id,student_id,status,
completed_at,...)
## assessment.quizzes(id,course_id,title,...)
## assessment.questions(id,quiz_id,type,prompt,options_json,
answer_json,...)
## 
assessment.attempts(id,quiz_id,student_id,started_at,submitted_at,
score,...)
## 
ai.documents(id,course_id,lesson_id,source_ref,...)
## 
ai.chunks(id,document_id,chunk_text,metadata_json,embedding
## VECTOR,...)
## 
ai.jobs(id,type,payload_json,status,result_json,error,created_at,
updated_at)
7.3Chỉmục&tốiưudữliệu(MVP)
## 
## Thiếtlậpdimensionembeddingđồngnhấtvớimodel(vídụ
768/1024/1536)vàlưumetadata(courseId/lessonId)đểfilterretrieval.
pgvector:tạoindexchoembeddingđểtăngtốctruyhồi(IVFFLAThoặc
HNSWtuỳpgvectorversion).MVPcóthểbắtđầuvớiIVFFLATvàtinh
chỉnhsau.
Khuyếnnghịtạoindexchocáctruyvấnthườngdùng(course_id,
student_id,lesson_id,quiz_id).
8.ThiếtkếAITutor(RAG)–mứcMVP
8.1Ingestionpipeline
1.Extract:lấynộidunglesson/material(text)từcontent-service(hoặc
storage).
2.Normalize:làmsạch/chuẩnhoávănbản,loạibỏnoise.

3.Chunking:chiađoạntheokíchthướctoken/char+overlap(vídụ500–
## 1,000tokensvớioverlap10–20%).
4.Embedding:gọiembeddingmodel(tuỳlựachọn)đểtạovector.
5.Store:lưuchunk+embeddingvàobảngai.chunks(pgvector).
8.2Retrieval&Answering
1.Nhậncâuhỏi+context(courseId/lessonIdoptional).
2.Vectorsearchtop-kchunkstrongpgvector(lọctheocourseId).
3.Composeprompt:system+question+retrievedcontext+instruction
tríchdẫnnguồn.
4.GọiLLM,nhậnanswer.
5.Trảvềanswer+danhsáchcitations(chunkId/lessonId).
8.3Lưuýchấtlượng&antoànMVP
BắtbuộcgiớihạnphạmviretrievaltheocourseIdđểgiảmtrảlờisaibối
cảnh.
Khikhôngtìmthấycontextđủtincậy:trảlời'khôngđủthôngtintrong
tàiliệu'thayvìbịa.
## 
Logthờigiantừngbước(retrieval/LLM)đểtốiưu.
9.ThiếtkếAsyncJobs(RedisQueue)
9.1Jobmodel&trạngthái
## 
Trạngtháiđềxuất:QUEUED→RUNNING→SUCCEEDED|FAILED.
JobpayloadlưuJSON(loạijob,courseId/lessonId,thamsố).
## 
## Idempotency:job-id/uniquekeyđểtránhchạytrùngtrongdemo.
Retry:tốithiểu1–3lần;lỗicuốichuyểnFAILEDvàghierrorstacktrace
rútgọn.

9.2VídụjobtrongMVP
INGEST_CONTENT:ingestlesson/materialvàovectorstore.
GENERATE_QUIZ:tạoquiz/câuhỏidựatrênnộidung(async).
10.Bảomậtvàcấuhình
10.1BảomậtAPI
JWTvalidationtạiGateway;propagateusercontext(userId/role)xuống
servicesquaheadernộibộ(đượcký/đượctincậytrongcluster).
RBAC:kiểmtraquyềntheorolevàownership(instructorchỉsửacourse
củamình).
CORScấuhìnhtheodomainfrontend(localpermissive,stagingrestrict).
## 
RatelimitnhẹtạiGatewaychoendpointAI(tuỳchọn).
10.2Cấuhìnhmôitrường(envvars)
## Cácbiếnmôitrườngtốithiểu(gợiý):
## DB_HOST,DB_PORT,DB_NAME,DB_USER,DB_PASSWORD
REDIS_HOST,REDIS_PORT,REDIS_PASSWORD(nếucó)
## 
JWT_SECRET/JWT_PUBLIC_KEY(tuỳcơchế),JWT_EXPIRES_IN
## AI_PROVIDER,AI_API_KEY,EMBEDDING_MODEL,CHAT_MODEL
## 
OTEL_EXPORTER_ENDPOINT(nếubậttracing),LOG_LEVEL
10.3Quảnlýsecrets(MVP)
Quyướcrotate:thayđổisecretbằngcáchcậpnhậtSecret+rollout
restart;sauMVPsẽđưavàoDevSecOpspipelinevàsecretscanning
mạnhhơn.
## 
Kubernetes/EKS:dùngSecret(hoặcExternalSecretsnếucó).Táchcấu
hìnhnon-secret(ConfigMap)vàsecret(Secret).
## 
Local:dùngfile.env(khôngcommit)+.env.example.Khônghardcode
APIkeys/DBpasswords.

11.Kiểmthửvàđảmbảochấtlượng
11.1ChiếnlượckiểmthửMVP
## 
Unittests:RBACpolicy,grading,progresscomputation,chunking
utilities.
## 
Integrationtests:authlogin,enrollcourse,attemptquiz,askAI.
E2Edemotests:chạybằngscript(curl/postmancollection)theokịch
bảndemo.
11.2TiêuchíDonekỹthuậttốithiểu
## 
APIcóOpenAPIspec+vídụrequest/response.
DBmigrationschạyđượctừđầu(cleanDB).
Logcócorrelation-id;lỗitrảvềtheoerrorformatthốngnhất.
11.3CItốithiểuởmứcPullRequest(PR)
MVPvẫnápdụngCIởmứcPRđểđảmbảochấtlượngtrướckhimerge.Các
bướcCInàykhôngbaogồmtựđộngtriểnkhai(CD)vàkhôngthaythế
pipelineDevSecOpshoànchỉnhsauMVP.
Build/compilevàkiểmtradependencyresolution.
Chạyunittests(vàintegrationtestsmứctốithiểunếucó).
Lint/format(Java:Checkstyle/Spotless;Python:ruff/black–tuỳchọn
côngcụ).
SAST/secretscanningcơbản(vídụ:Semgrep+Gitleaks),thiếtlậpmức
chặn(fail)cholỗinghiêmtrọng.
Xuấtartefactbáocáo(testreport)đểreviewkhicần.

12.Triểnkhai(Deployment)–chưacóCI/CDhoànchỉnh
12.1ChạylocalbằngDockerCompose
1.Khởiđộngdependencies:Postgres(kèmpgvector)vàRedisquadocker-
compose.
2.Chạymigrationschotừngservice(Flyway/Alembic).
3.StartGatewayvàcácservices(dockercomposeuphoặcchạybằngIDE).
4.KiểmtrahealthendpointsvàtruycậpSwagger/OpenAPI.
12.2TriểnkhaithủcônglênKubernetes/EKS
1.Provisionhạtầng(tuỳchọn):EKS+RDSPostgres+Redis(Elasticache)
bằngTerraform.
2.Buildimagethủcông(dockerbuild)vàpushlênregistry(ECRhoặc
registrykhác).
3.Applymanifests/Helm:namespace,configmaps,secrets,deployments,
services,ingress.
4.Kiểmtrarolloutstatus,logs,healthchecks.
5.Chạydemotheoscriptvàthuthậpkếtquả.
12.3Quytrìnhpháthànhthủcông(ManualRelease)choMVP
SauMVP:thaythếmanualreleasebằngpipelineDevSecOps+GitOps
(ArgoCD).
## 
Giữmộtchangelogngắn(CHANGELOG.md)vàghichúbreakingchanges
choAPIcontracts.
## 
Tagversiontheosemanticversioning(v0.xchoMVP).Build/pushimage
thủcôngtheotagvàcậpnhậtimagetagtrongmanifest/Helmvalues.
13.Kịchbảndemovàkếtquảkỳvọng
13.1Kịchbảndemobắtbuộc
1.Auth/RBAC:login→gọiAPIbảovệquaGateway.

2.LMScore:instructortạocourse+content→studentenroll→cậpnhật
progress.
3.Assessment:instructortạoquiz→studentattempt→nhậnscore.
4.AITutor:ingestcontent→askAI→nhậnanswer+citation.
5.Async:triggergenerate-quiz/ingestjob→theodõitrạngthái→
completed/failedrõràng.
13.2Kếtquảkỳvọng
Hệthốngchạyend-to-endổnđịnh;thaotácdemolặplạiđược.
## 
## Cótàiliệuđủđểngườimớiđọcvàbắtđầuchạydựántrong30–60phút.
Cólog/tracingtốithiểuđểxácđịnhnguyênnhânlỗivàđiểmnghẽn
latency.
14.HạnchếcủaMVPvàhướngpháttriển
14.1Hạnchế
## 
ChưacópipelineCI/CDhoànchỉnh(tựđộngbuild/push/deploy).Hiện
cóCImứcPullRequest(build/test/lint/scancơbản);triểnkhai
staging/demovẫnthủcông.
Bảomậtnângcao(WAF,rotation,audit)chưatriểnkhai.
RAGchấtlượngphụthuộcdữliệuvàchiếnlượcchunking;chưacó
rerank/feedbackloop.
14.2HướngpháttriểnsauMVP
MởrộngtừCImứcPullRequestlênCI/CD+GitOps(ArgoCD):
build/pushimagetựđộng,automatedtests,securityscanning
(SAST/Dependency/Container/Secrets)vàtựđộngdeploy.
## 
Bổsungobjectstoragechotàiliệu(S3),signedURLupload/download.

## 
Nângcấpasync/eventing(RabbitMQ/Kafka)nếusốlượngjob/event
tăng.
CảithiệnAI:reranking,citationstốthơn,đánhgiáchấtlượng(RAGeval).
15.Phụlục:Danhmụcartefactskhuyếnnghị
## 
## Sơđồkiếntrúc(componentdiagram+requestflow).
OpenAPIspec(gateway+từngservice).
## 
ERD/datamodeltheoschemaperservice.
Postmancollectionhoặccurlscriptschodemo.
## 
README:localrun+deploythủcông+troubleshooting.