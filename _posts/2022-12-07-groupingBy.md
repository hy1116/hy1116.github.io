---
title : "Java - groupingBy"
category : "Java"
tags : [lambda]
date : 2022-12-07T12:00:00
last_modified_at: 2023-01-14T12:00:00
comment: true
---
# `groupingBy`

```java
public class GroupingExam2 {
    public static void main(String[] args) {
        List<Student> totalList = StudentMockData.totalList2;

        Stream<Student> totalStream = totalList.stream();

        Function<Student, Student.City> classifier = Student::getCity;
        Function<Student, String> mapper = Student::getName;

        Collector<String, ?, List<String>> collector1 = Collectors.toList();
                // Collectors의 mapping() 메소드로 Student를 이름으로 매핑하고 이름을 List에 수집하는 Collector를 얻는다.
        Collector<Student, ?, List<String>> collector2 = Collectors.mapping(mapper, collector1);

        Collector<Student, ?, Map<Student.City, List<String>>> collector3 =
                Collectors.groupingBy(classifier, collector2);

        Map<Student.City, List<String>> mapByCity = totalStream.collect(collector3);
        System.out.println(mapByCity);

        mapByCity = totalList.stream()
                .collect(
                        Collectors.groupingBy(
                                Student::getCity,
                                Collectors.mapping(Student::getName, Collectors.toList())
                        )
                );
        System.out.println(mapByCity);

                // groupingBy(Function<? super T,? extends K> classifier, Supplier<M> mapFactory, Collector<? super T,A,D> downstream)
                // 위의 코드와 동일하나 TreeMap 객체를 생성해서 반환하도록 한다.
                mapByCity = totalList.stream()
                .collect(
                        Collectors.groupingBy(
                                Student::getCity,
                                TreeMap::new,
                                Collectors.mapping(Student::getName, Collectors.toList())
                        )
                );
        System.out.println(mapByCity);
    }
}
```

---

*references*

 - [https://cornswrold.tistory.com/387](https://cornswrold.tistory.com/387)