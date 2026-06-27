package com.haruon.groupware.adapter.docs.webapi.company;

import com.haruon.groupware.adapter.docs.RestDocsSupport;
import com.haruon.groupware.adapter.webapi.company.CompanyQueryApi;
import com.haruon.groupware.application.company.provided.forRetriever.CompanyRetriever;

import static org.mockito.Mockito.mock;

public class CompanyQueryApiDocsTest extends RestDocsSupport {

    private final CompanyRetriever companyRetriever = mock(CompanyRetriever.class);
    private final String REQUEST_MAPPING_URL = "/api/companies";

    @Override
    protected Object initController() {
        return new CompanyQueryApi(companyRetriever);
    }
}
