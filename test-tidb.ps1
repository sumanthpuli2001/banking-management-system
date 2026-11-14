$env:SPRING_DATASOURCE_URL = "jdbc:mysql://gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/enterprise_bank_db?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3"
$env:SPRING_DATASOURCE_USERNAME = "HVtbf3tQkyxXK4C.root"
$env:SPRING_DATASOURCE_PASSWORD = "LACrrRIQSQxK1tDU"
$env:PORT = "8989"

& "C:\Users\Sumanth Puli\.gemini\antigravity\scratch\mvn\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run -f "D:\Banking Management System\backend\pom.xml"
