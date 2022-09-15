/*
  SPDX-License-Identifier: Apache-2.0
*/

import {Object, Property} from 'fabric-contract-api';

@Object()
export class Asset {
    @Property()
    public docType?: string;

    @Property()
    public ID: string;

    @Property()
    public ApprovedBy: string;

    @Property()
    public CurrentSchool: string;

    @Property()
    public DateRequested: string;

    @Property()
    public DateSubmitted: string;

    @Property()
    public RequestingSchool: string;

    @Property()
    public serializedTFile: string;

    @Property()
    public StudentID: string;

    @Property()
    public StudentName: string;

}
