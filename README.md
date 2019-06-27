# getcanvas
Command line utility for making ad hoc Canvas API queries.

## Usage

`$ getcanvas courses 90`

Retrieves array of Canvas entities for endpoint "courses/90"

Sample output:
```
Got status "200 OK" from https://yourdomain.instructure.com/api/v1/courses/90

[
  {
    "id": 90,
    "name": "Course A",
    "account_id": 3,
    "uuid": "jlksdufkilksjfkldlaskjfkl",
    "start_at": "2018-10-13T21:06:27Z",
    "grading_standard_id": null,
    "is_public": false,
    "created_at": "2017-12-13T21:02:48Z",
    "course_code": "code red",
    "default_view": "wiki",
    "root_account_id": 1,
    "enrollment_term_id": 1,
    "license": "private",
    "end_at": null,
    "public_syllabus": false,
    "public_syllabus_to_auth": false,
    "storage_quota_mb": 5000,
    "is_public_to_auth_users": false,
    "hide_final_grades": false,
    "apply_assignment_group_weights": false,
    "calendar": {
      "ics": "https://ourdomain.instructure.com/feeds/calendars/course_datedatedatedate.ics"
    },
    "time_zone": "America/Los_Angeles",
    "blueprint": false,
    "sis_course_id": "sisidaa",
    "sis_import_id": null,
    "integration_id": null,
    "enrollments": [
      {
        "type": "teacher",
        "role": "TeacherEnrollment",
        "role_id": 12,
        "user_id": 42,
        "enrollment_state": "active"
      }
    ],
    "workflow_state": "available",
    "restrict_enrollments_to_course_dates": false
  }
]

1 objects returned from querying courses/90
```

---

`$ getcanvas courses 90 sections`

Retrieves array of Canvas entities for endpoint "courses/90/sections"

---

`$ getcanvas courses -o id name`

Ouputs comma-separated id & name fields of Canvas entities for endpoint "courses"

Sample output:

```
Got status "200 OK" from https://yourdomain.instructure.com/api/v1/courses

80, Course AA
91, Course BB
92, Course CC
67, Course DD
94, Course EE
95, Course FF
96, Course GG

7 objects returned from querying courses
```

---

`$ getcanvas courses -o calendar.ics`

Outputs the nested calendar.ics field of Canvas entities for endpoint "courses"

---

`$ getcanvas courses -p enrollment_type teacher`

Retrieves Canvas entities for endpoint "courses", filtered by query parameter "enrollment_type" with value of "teacher"

---

`$ getcanvas courses -a state[] unpublished deleted`

Retrieves Canvas entities for endpoint "courses", filtered by query parameter "state[]" with values "unpublished" and "deleted"

---

`$ getcanvas courses -f id 52`

Retrieves Canvas entities for endpoint "courses", filtered by id == 52.

---

`$ getcanvas -t courses`

Retrieves data from test Canvas site rather than live site, which is the default.

---

`$ getcanvas -b courses`

Retrieves data from beta Canvas site rather than live site, which is the default.

---

`$ getcanvas courses -e public_description`

Retrieves Canvas entities for endpoint "courses", filtered by course objects that contain a non-null value for the property "public_description"

 
---

`$ getcanvas courses -j`

Write only Canvas entities JSON & error messages to stdout

## Dependencies
* dotenv
* parse-link-header
* tiny-json-http

## Configuration

Create a *.env* file or environment variables that defines these API values for your Canvas instance:

ACCESS_TOKEN="your-secret-access-token"

BASE_URL_TEST="https://yourdomain.test.instructure.com/api/v1/"

BASE_URL_LIVE="https://yourdomain.instructure.com/api/v1/"

BASE_URL_BETA="https://yourdomain.beta.instructure.com/api/v1/"

## Authors

* **Terence Shek** - *Programmer* - [tpshek](https://github.com/tpshek/)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
